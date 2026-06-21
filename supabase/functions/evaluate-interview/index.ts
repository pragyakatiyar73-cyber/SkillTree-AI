import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EvaluationRequest {
  question: string;
  category: string;
  userAnswer: string;
  idealAnswer: string;
  keyPoints: string[];
}

interface EvaluationResponse {
  score: number;
  correctPoints: string[];
  missingPoints: string[];
  improvements: string[];
  idealAnswer: string;
  feedback: string;
}

interface ReportRequest {
  category: string;
  evaluations: EvaluationResponse[];
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
}

interface ReportResponse {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

const EVALUATION_PROMPT = `You are an expert interview evaluator. Evaluate the candidate's answer against the ideal answer and key points.

Return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-10>,
  "correctPoints": ["points the candidate covered correctly"],
  "missingPoints": ["important points the candidate missed"],
  "improvements": ["specific suggestions to improve the answer"],
  "feedback": "brief encouraging feedback paragraph"
}

Scoring guidelines:
- 9-10: Exceptional, covers all key points with depth and clarity
- 7-8: Good, covers most key points with some depth
- 5-6: Satisfactory, covers some key points but lacks depth
- 3-4: Below expectations, misses many key points
- 0-2: Poor, shows lack of understanding

Be fair but thorough in evaluation.`;

const REPORT_PROMPT = `You are an expert career coach. Analyze the interview performance and generate a comprehensive report.

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "A 2-3 paragraph overall assessment of the interview performance",
  "strengths": ["3-5 specific strengths demonstrated"],
  "areasForImprovement": ["3-5 specific areas that need work"],
  "recommendations": ["3-5 actionable next steps for improvement"]
}

Be constructive, specific, and encouraging. Focus on actionable advice.`;

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];

async function tryGenerateContent(genAI: GoogleGenerativeAI, prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return result.response.text().trim();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Model ${modelName} failed:`, lastError.message);
      if (lastError.message.includes("not found") || lastError.message.includes("not available")) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("No Gemini models available");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact support to enable AI features." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Handle report generation
    if (body.generateReport) {
      const { category, evaluations, overallScore, technicalScore, communicationScore, confidenceScore }: ReportRequest & { generateReport: boolean } = body;

      const prompt = `${REPORT_PROMPT}

Category: ${category}
Overall Score: ${overallScore}/10
Technical Score: ${technicalScore}/10
Communication Score: ${communicationScore}/10
Confidence Score: ${confidenceScore}/10

Individual Question Evaluations:
${evaluations.map((e, i) => `
Question ${i + 1} - Score: ${e.score}/10
Correct Points: ${e.correctPoints.join(', ') || 'None identified'}
Missing Points: ${e.missingPoints.join(', ') || 'None identified'}
Improvements: ${e.improvements.join(', ') || 'None'}
`).join('\n')}`;

      let rawContent: string;
      try {
        rawContent = await tryGenerateContent(genAI, prompt);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        return new Response(
          JSON.stringify({
            summary: "Unable to generate detailed report. Please review your individual question scores.",
            strengths: ["Completed the interview"],
            areasForImprovement: ["Practice more interview questions"],
            recommendations: ["Take more mock interviews to improve"],
            error: errMsg,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let cleaned = rawContent;
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      }

      let parsed: ReportResponse;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return new Response(
          JSON.stringify({
            summary: "Unable to generate detailed report. Please review your individual question scores.",
            strengths: ["Completed the interview"],
            areasForImprovement: ["Practice more interview questions"],
            recommendations: ["Take more mock interviews to improve"]
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          summary: String(parsed.summary ?? ""),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle answer evaluation
    const { question, category, userAnswer, idealAnswer, keyPoints }: EvaluationRequest = body;

    if (!question || !userAnswer) {
      return new Response(
        JSON.stringify({ error: "Question and answer are required for evaluation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `${EVALUATION_PROMPT}

Question (${category}): ${question}

Ideal Answer: ${idealAnswer}

Key Points to Cover: ${keyPoints.join(', ')}

Candidate's Answer: ${userAnswer}`;

    let rawContent: string;
    try {
      rawContent = await tryGenerateContent(genAI, prompt);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      // Fallback evaluation
      const fallbackResponse: EvaluationResponse = {
        score: 5,
        correctPoints: ["Provided an answer"],
        missingPoints: keyPoints.slice(0, 3),
        improvements: ["Expand on key concepts", "Provide more specific examples"],
        feedback: "Your answer shows understanding but could be more comprehensive. Review the ideal answer for a complete response.",
        idealAnswer: idealAnswer,
      };
      return new Response(
        JSON.stringify({ ...fallbackResponse, error: errMsg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleaned = rawContent;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed: EvaluationResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback evaluation
      parsed = {
        score: 5,
        correctPoints: ["Provided an answer"],
        missingPoints: keyPoints.slice(0, 3),
        improvements: ["Expand on key concepts", "Provide more specific examples"],
        feedback: "Your answer shows understanding but could be more comprehensive. Review the ideal answer for a complete response.",
        idealAnswer: idealAnswer,
      };
    }

    const response: EvaluationResponse = {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 5)),
      correctPoints: Array.isArray(parsed.correctPoints) ? parsed.correctPoints : [],
      missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      feedback: String(parsed.feedback || ""),
      idealAnswer: idealAnswer,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
