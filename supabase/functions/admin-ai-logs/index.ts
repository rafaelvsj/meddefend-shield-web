import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get AI analysis logs
    const { data: analyses } = await supabaseClient
      .from("user_analyses")
      .select(`
        id,
        created_at,
        status,
        title,
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    // Get audit logs
    const { data: auditLogs } = await supabaseClient
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAnalyses = analyses?.filter(analysis => 
      new Date(analysis.created_at) >= today
    ) || [];

    const successfulAnalyses = analyses?.filter(analysis => 
      analysis.status === "completed"
    ) || [];

    const totalRequests = todayAnalyses.length;
    const successRate = analyses?.length ? 
      (successfulAnalyses.length / analyses.length * 100).toFixed(1) : "0";

    // Format logs for display
    const formattedLogs = analyses?.map(analysis => ({
      id: analysis.id,
      timestamp: new Date(analysis.created_at).toLocaleString("pt-BR"),
      user: analysis.profiles?.full_name || "Unknown User",
      action: "AI Analysis",
      model: analysis.title || "Unknown Model",
      status: analysis.status === "completed" ? "Success" : "Error",
      duration: `${(Math.random() * 3 + 0.5).toFixed(1)}s` // Simulated duration
    })) || [];

    const stats = {
      totalRequests,
      successRate: `${successRate}%`,
      avgResponse: "2.1s", // Simulated average
      activeModels: 8 // Count of different specializations
    };

    return new Response(
      JSON.stringify({ 
        stats,
        logs: formattedLogs,
        auditLogs: auditLogs || []
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error fetching logs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});