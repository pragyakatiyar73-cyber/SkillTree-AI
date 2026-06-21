import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an expert AI Mentor for students pursuing technology and software engineering careers. Your role is to:

- Answer student questions clearly and thoroughly
- Explain technical concepts step-by-step with simple language and relatable examples
- Create personalized study plans based on the student's goals and current skill level
- Generate quizzes and practice questions when a student wants to test their knowledge
- Recommend high-quality learning resources (books, courses, documentation, practice platforms)
- Motivate students during challenging times and celebrate their progress
- Help with career planning: resume tips, interview prep, project ideas, DSA practice strategies
- Provide roadmaps for specific career goals (frontend, backend, ML, DevOps, etc.)

Formatting guidelines:
- Use markdown formatting: **bold** for key terms, bullet lists for steps, \`code\` for technical terms
- Break complex explanations into numbered steps
- Include code snippets when explaining programming concepts
- Keep explanations concise but comprehensive
- When generating quizzes, number each question clearly and provide answers at the end

Always be encouraging, patient, and supportive. Remember that every student learns at their own pace.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      let errMsg = `OpenAI API error (${openaiRes.status})`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed?.error?.message ?? errMsg;
      } catch { /* ignore */ }
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: openaiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the SSE response directly to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = openaiRes.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (e) {
        await writer.write(encoder.encode(`data: {"error":"${String(e)}"}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
