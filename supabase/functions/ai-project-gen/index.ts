import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a senior software architect.

Generate a complete project blueprint for the user's idea.

Your response MUST be ONLY a valid JSON object with no markdown formatting, no code fences, and no extra text. The JSON must match this exact structure:

{
  "title": "string",
  "overview": "string (2-3 paragraphs)",
  "features": [
    { "name": "string", "description": "string" }
  ],
  "techStack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "devops": ["string"],
    "testing": ["string"],
    "other": ["string"]
  },
  "folderStructure": "string (tree-like ASCII representation)",
  "databaseSchema": "string (SQL or markdown description)",
  "roadmap": [
    { "phase": "string", "duration": "string", "tasks": ["string"] }
  ]
}

Guidelines:
- Choose a modern, production-ready tech stack.
- Include 8-12 features.
- The folder structure should be realistic.
- The database schema should include all major tables.
- The roadmap should have 4-6 phases.
- Write in clear, professional language.`;

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

    const { idea } = await req.json();
    if (!idea || typeof idea !== "string" || idea.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please provide a project idea (at least 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = SYSTEM_PROMPT + "\n\nIdea: " + idea.trim();

    let rawContent: string;
    try {
      rawContent = await tryGenerateContent(genAI, prompt);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a moment.", details: errMsg }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleaned = rawContent;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Could not generate a valid project blueprint. Please try rephrasing your idea.", raw: rawContent.substring(0, 500) }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const output = {
      title: String(parsed.title ?? "Untitled Project"),
      overview: String(parsed.overview ?? ""),
      features: Array.isArray(parsed.features) ? parsed.features : [],
      techStack: typeof parsed.techStack === "object" && parsed.techStack !== null ? parsed.techStack : {},
      folderStructure: String(parsed.folderStructure ?? ""),
      databaseSchema: String(parsed.databaseSchema ?? ""),
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
    };

    return new Response(
      JSON.stringify(output),
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
