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
        function: 'admin-users',
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
        function: 'admin-users',
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
        function: 'admin-users',
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

    // Get users with their profiles, roles and subscriptions using service client
    const { data: users, error } = await serviceClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        created_at,
        updated_at,
        user_roles (
          role
        ),
        subscribers (
          subscription_tier,
          subscribed
        )
      `);

    if (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-users',
        admin_id: user.id,
        action: 'fetch_users',
        status: 'error',
        error: error.message
      }));
      throw error;
    }

    // Format the data
    const formattedUsers = users?.map(user => ({
      id: user.id,
      name: user.full_name || "Unknown",
      email: user.email || "No email",
      plan: user.subscribers?.[0]?.subscription_tier || "free",
      role: user.user_roles?.[0]?.role || "user",
      status: user.subscribers?.[0]?.subscribed ? "Active" : "Inactive",
      lastLogin: user.updated_at,
      createdAt: user.created_at
    })) || [];

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      function: 'admin-users',
      admin_id: user.id,
      action: 'fetch_users',
      status: 'success',
      users_count: formattedUsers.length,
      execution_time_ms: Date.now() - start
    }));

    return new Response(
      JSON.stringify({ users: formattedUsers }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error fetching admin users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});