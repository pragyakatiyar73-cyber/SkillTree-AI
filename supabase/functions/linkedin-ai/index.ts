import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LinkedInProfile {
  name: string;
  skills: string[];
  role: string;
  experience: string;
  college: string;
  branch: string;
  year: string;
  goal: string;
}

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

async function tryGenerate(genAI: GoogleGenerativeAI, prompt: string): Promise<string> {
  let lastError: Error | null = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      return result.response.text().trim();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Model ${modelName} failed:`, lastError.message);
      if (lastError.message.includes("not found") || lastError.message.includes("not available")) continue;
      throw lastError;
    }
  }
  throw lastError || new Error("No Gemini models available");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add GEMINI_API_KEY to secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Generate Headline
    if (body.type === "headline") {
      const profile = body.profile as LinkedInProfile;
      const prompt = `Generate a compelling LinkedIn headline for a ${profile.role || "student"} with skills in ${profile.skills.join(", ")}. The headline should be professional, under 220 characters, include key skills, and mention a career goal. Return ONLY the headline text, no quotes or explanations.`;
      let headline = await tryGenerate(genAI, prompt);
      headline = headline.replace(/["']/g, "").trim();
      if (headline.length > 220) headline = headline.slice(0, 217) + "...";
      return new Response(JSON.stringify({ headline }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate About Section
    if (body.type === "about") {
      const profile = body.profile as LinkedInProfile;
      const prompt = `Write a professional LinkedIn "About" section for a ${profile.role || "student"} studying ${profile.branch} at ${profile.college}. Skills: ${profile.skills.join(", ")}. Career goal: ${profile.goal || "software engineering"}. The About section should be 200-300 words, in first person, highlight passion, achievements, skills, and what they are looking for. Return ONLY the About text, no quotes or markdown.`;
      const about = await tryGenerate(genAI, prompt);
      return new Response(JSON.stringify({ about }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate Skills
    if (body.type === "skills") {
      const profile = body.profile as LinkedInProfile;
      const prompt = `Suggest 10-15 LinkedIn skills for a ${profile.role || "student"} with expertise in ${profile.skills.join(", ")} aiming for ${profile.goal || "software engineering"}. Return ONLY a comma-separated list of skills, no explanations.`;
      const raw = await tryGenerate(genAI, prompt);
      const skills = raw.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50).slice(0, 15);
      return new Response(JSON.stringify({ skills }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Analyze Profile
    if (body.type === "analyze") {
      const { profileData } = body;
      const prompt = `Analyze this LinkedIn profile data and provide a score + suggestions.

Profile Data:
${JSON.stringify(profileData, null, 2)}

Return ONLY a JSON object with this exact structure:
{
  "overall_score": <number 0-100>,
  "headline_score": <number 0-100>,
  "about_score": <number 0-100>,
  "skills_score": <number 0-100>,
  "experience_score": <number 0-100>,
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"],
  "strengths": ["strength 1", "strength 2"]
}`;
      const raw = await tryGenerate(genAI, prompt);
      let cleaned = raw;
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      }
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return new Response(
          JSON.stringify({
            overall_score: 50,
            headline_score: 50,
            about_score: 50,
            skills_score: 50,
            experience_score: 50,
            suggestions: ["Add more detail to your profile", "Include quantifiable achievements", "Add a professional headshot"],
            strengths: ["Profile is active"]
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({
        overall_score: Math.min(100, Math.max(0, Number(parsed.overall_score) || 50)),
        headline_score: Math.min(100, Math.max(0, Number(parsed.headline_score) || 50)),
        about_score: Math.min(100, Math.max(0, Number(parsed.about_score) || 50)),
        skills_score: Math.min(100, Math.max(0, Number(parsed.skills_score) || 50)),
        experience_score: Math.min(100, Math.max(0, Number(parsed.experience_score) || 50)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : []
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'headline', 'about', 'skills', or 'analyze'." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
