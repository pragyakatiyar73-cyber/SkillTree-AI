import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an expert resume writer who specializes in creating compelling, ATS-friendly professional summaries.

Given a user's profile data, write a concise, powerful professional summary (2-3 sentences) that:
1. Highlights their strongest qualifications
2. Mentions key technologies/skills
3. Uses strong action verbs
4. Is optimized for ATS keyword scanning
5. Sounds natural and professional, not robotic

Respond with ONLY the summary text. No markdown, no quotes, no extra explanation.`;

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
        JSON.stringify({ error: "AI service is not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { profile } = await req.json();
    if (!profile || typeof profile !== "object") {
      return new Response(
        JSON.stringify({ error: "Profile information is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Write a professional summary for this candidate:

Name: ${profile.full_name || "Unknown"}
Skills: ${(profile.skills || []).map((s: {skill: string}) => s.skill).join(", ")}
Experience: ${(profile.experience || []).map((e: {role: string; company: string}) => `${e.role} at ${e.company}`).join("; ")}
Projects: ${(profile.projects || []).map((p: {title: string}) => p.title).join(", ")}
Education: ${(profile.education || []).map((edu: {degree: string; institution: string}) => `${edu.degree} from ${edu.institution}`).join("; ")}`;

    const genAI = new GoogleGenerativeAI(apiKey);

    let summary: string;
    try {
      summary = await tryGenerateContent(genAI, SYSTEM_PROMPT + "\n\n" + prompt);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable. Please try again.", details: errMsg }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ summary }),
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
