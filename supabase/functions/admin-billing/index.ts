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
        function: 'admin-billing',
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
        function: 'admin-billing',
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
        function: 'admin-billing',
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

    // Get subscription stats by tier using service client
    const { data: subscriptions, error: subsError } = await serviceClient
      .from("subscribers")
      .select("subscription_tier, subscribed");

    if (subsError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-billing',
        admin_id: user.id,
        action: 'fetch_subscriptions',
        status: 'error',
        error: subsError.message
      }));
      throw subsError;
    }

    // Calculate plan statistics
    const planStats = {
      Basic: { users: 0, revenue: 0, price: 29 },
      Pro: { users: 0, revenue: 0, price: 59 },
      Premium: { users: 0, revenue: 0, price: 99 }
    };

    subscriptions?.forEach(sub => {
      if (sub.subscribed) {
        const tier = sub.subscription_tier;
        if (tier === "basic") {
          planStats.Basic.users++;
          planStats.Basic.revenue += 29;
        } else if (tier === "pro") {
          planStats.Pro.users++;
          planStats.Pro.revenue += 59;
        } else if (tier === "premium") {
          planStats.Premium.users++;
          planStats.Premium.revenue += 99;
        }
      }
    });

    // Get recent transactions (using user_analyses as proxy for now) using service client
    const { data: recentAnalyses, error: analysesError } = await serviceClient
      .from("user_analyses")
      .select(`
        id,
        created_at,
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (analysesError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-billing',
        admin_id: user.id,
        action: 'fetch_analyses',
        status: 'error',
        error: analysesError.message
      }));
      throw analysesError;
    }

    const recentTransactions = recentAnalyses?.map((analysis, index) => ({
      id: analysis.id,
      user: analysis.profiles?.full_name || "Unknown User",
      plan: ["Premium", "Pro", "Basic"][index % 3],
      amount: ["R$ 99,00", "R$ 59,00", "R$ 29,00"][index % 3],
      status: "Completed",
      date: new Date(analysis.created_at).toLocaleDateString("pt-BR")
    })) || [];

    const plans = [
      {
        name: "Basic",
        price: "R$ 29",
        users: planStats.Basic.users,
        revenue: `R$ ${planStats.Basic.revenue.toLocaleString("pt-BR")}`
      },
      {
        name: "Pro", 
        price: "R$ 59",
        users: planStats.Pro.users,
        revenue: `R$ ${planStats.Pro.revenue.toLocaleString("pt-BR")}`
      },
      {
        name: "Premium",
        price: "R$ 99", 
        users: planStats.Premium.users,
        revenue: `R$ ${planStats.Premium.revenue.toLocaleString("pt-BR")}`
      }
    ];

    const totalRevenue = planStats.Basic.revenue + planStats.Pro.revenue + planStats.Premium.revenue;
    const totalUsers = planStats.Basic.users + planStats.Pro.users + planStats.Premium.users;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      function: 'admin-billing',
      admin_id: user.id,
      action: 'fetch_billing_data',
      status: 'success',
      total_users: totalUsers,
      total_revenue: totalRevenue,
      execution_time_ms: Date.now() - start
    }));

    return new Response(
      JSON.stringify({ 
        plans,
        recentTransactions,
        totalRevenue,
        totalUsers
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error fetching billing data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});