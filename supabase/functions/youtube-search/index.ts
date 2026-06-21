import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your environment secrets.", videos: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim() === "") {
      return new Response(
        JSON.stringify({ error: "query string is required", videos: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQuery = encodeURIComponent(`${query.trim()} tutorial programming`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=5&relevanceLanguage=en&safeSearch=strict&key=${youtubeKey}`;

    const ytRes = await fetch(url);

    if (!ytRes.ok) {
      const errBody = await ytRes.text();
      let errMsg = `YouTube API error (${ytRes.status})`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed?.error?.message ?? errMsg;
      } catch { /* ignore */ }
      return new Response(
        JSON.stringify({ error: errMsg, videos: [] }),
        { status: ytRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await ytRes.json();

    const videos = (data.items ?? []).map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        description: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? "",
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error", videos: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
