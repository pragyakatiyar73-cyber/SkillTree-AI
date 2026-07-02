import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Profile {
  id: string;
  is_admin: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, is_admin")
    .eq("id", userData.user.id)
    .single<Profile>();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!profile.is_admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin only." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const [
      profilesCount,
      roadmapsCount,
      projectsCount,
      interviewsCount,
      resumesCount,
      mentorCount,
      feedbackCount,
    ] = await Promise.all([
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("roadmaps").select("id", { count: "exact", head: true }),
      adminClient.from("ai_projects").select("id", { count: "exact", head: true }),
      adminClient.from("mock_interviews").select("id", { count: "exact", head: true }),
      adminClient.from("resumes").select("id", { count: "exact", head: true }),
      adminClient.from("mentor_sessions").select("id", { count: "exact", head: true }),
      adminClient.from("feedback").select("id", { count: "exact", head: true }),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const { count: activeTodayCount } = await adminClient
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today);

    const { data: dailyData } = await adminClient
      .from("analytics_daily")
      .select("*")
      .order("date", { ascending: true })
      .limit(7);

    const { data: feedbackBest } = await adminClient
      .from("feedback")
      .select("best_feature")
      .not("best_feature", "is", null);

    const { data: feedbackMissing } = await adminClient
      .from("feedback")
      .select("missing_feature")
      .not("missing_feature", "is", null);

    const bestCounts: Record<string, number> = {};
    feedbackBest?.forEach((f: { best_feature: string }) => {
      bestCounts[f.best_feature] = (bestCounts[f.best_feature] || 0) + 1;
    });

    const missingCounts: Record<string, number> = {};
    feedbackMissing?.forEach((f: { missing_feature: string }) => {
      missingCounts[f.missing_feature] = (missingCounts[f.missing_feature] || 0) + 1;
    });

    const featureUsage = [
      { name: "Roadmaps", count: roadmapsCount.count || 0 },
      { name: "Projects", count: projectsCount.count || 0 },
      { name: "Interviews", count: interviewsCount.count || 0 },
      { name: "Resumes", count: resumesCount.count || 0 },
      { name: "Mentor", count: mentorCount.count || 0 },
      { name: "Feedback", count: feedbackCount.count || 0 },
    ];

    const dailyTrend = (dailyData || []).map((d: { date: string; active_users: number }) => ({
      date: d.date,
      users: d.active_users,
    }));

    const feedbackStats = Object.entries(bestCounts)
      .map(([name, count]) => ({ best_feature: name, count }))
      .sort((a, b) => b.count - a.count);

    const missingFeatures = Object.entries(missingCounts)
      .map(([name, count]) => ({ missing_feature: name, count }))
      .sort((a, b) => b.count - a.count);

    const analytics = {
      stats: {
        totalUsers: profilesCount.count || 0,
        activeToday: activeTodayCount || 0,
        roadmapsGenerated: roadmapsCount.count || 0,
        projectsCreated: projectsCount.count || 0,
        mockInterviews: interviewsCount.count || 0,
        resumesBuilt: resumesCount.count || 0,
        mentorSessions: mentorCount.count || 0,
        feedbackCount: feedbackCount.count || 0,
      },
      featureUsage,
      dailyTrend,
      feedbackStats,
      missingFeatures,
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch analytics" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
