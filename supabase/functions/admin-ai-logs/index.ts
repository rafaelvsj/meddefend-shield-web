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

  const start = Date.now();
  
  try {
    // Initialize Supabase clients - service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-ai-logs',
        action: 'auth_check',
        status: 'error',
        error: 'no_authorization_header'
      }));
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await authClient.auth.getUser(token);
    const user = data.user;

    if (authError || !user) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-ai-logs',
        admin_id: null,
        action: 'auth_verify',
        status: 'error',
        error: authError?.message || 'invalid_token'
      }));
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if user is admin using service client
    const { data: roleData, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData || roleData.role !== "admin") {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-ai-logs',
        admin_id: user.id,
        action: 'role_check',
        status: 'error',
        error: 'access_denied',
        role: roleData?.role || 'none'
      }));
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get AI analysis logs using service client
    const { data: analyses, error: analysesError } = await serviceClient
      .from("user_analyses")
      .select(`
        id,
        created_at,
        status,
        title,
        user_id
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (analysesError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-ai-logs',
        admin_id: user.id,
        action: 'fetch_ai_logs',
        status: 'error',
        error: analysesError.message
      }));
      throw analysesError;
    }

    // Get audit logs using service client
    const { data: auditLogs, error: auditError } = await serviceClient
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    if (auditError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-ai-logs',
        admin_id: user.id,
        action: 'fetch_audit_logs',
        status: 'error',
        error: auditError.message
      }));
      throw auditError;
    }

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
      user: analysis.user_id || "Unknown User",
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

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      function: 'admin-ai-logs',
      admin_id: user.id,
      action: 'fetch_logs_data',
      status: 'success',
      ai_logs_count: formattedLogs.length,
      audit_logs_count: auditLogs?.length || 0,
      execution_time_ms: Date.now() - start
    }));

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