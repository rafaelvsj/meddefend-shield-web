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

    // Get all profiles first
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("id, full_name, email, created_at, updated_at");

    if (profilesError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-users',
        admin_id: user.id,
        action: 'fetch_profiles',
        status: 'error',
        error: profilesError.message
      }));
      throw profilesError;
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-users',
        admin_id: user.id,
        action: 'fetch_roles',
        status: 'error',
        error: rolesError.message
      }));
      throw rolesError;
    }

    // Get all subscribers
    const { data: subscribers, error: subscribersError } = await serviceClient
      .from("subscribers")
      .select("user_id, subscription_tier, subscribed");

    if (subscribersError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-users',
        admin_id: user.id,
        action: 'fetch_subscribers',
        status: 'error',
        error: subscribersError.message
      }));
      throw subscribersError;
    }

    // Manual JOIN in JavaScript
    const users = profiles?.map(profile => {
      // Find user role
      const userRole = userRoles?.find(role => role.user_id === profile.id);
      // Find subscription
      const subscription = subscribers?.find(sub => sub.user_id === profile.id);

      return {
        id: profile.id,
        name: profile.full_name || "Unknown",
        email: profile.email || "No email",
        plan: subscription?.subscription_tier || "free",
        role: userRole?.role || "user",
        status: subscription?.subscribed ? "Active" : "Inactive",
        lastLogin: profile.updated_at,
        createdAt: profile.created_at
      };
    }) || [];


    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      function: 'admin-users',
      admin_id: user.id,
      action: 'fetch_users',
      status: 'success',
      users_count: users.length,
      profiles_count: profiles?.length || 0,
      roles_count: userRoles?.length || 0,
      subscribers_count: subscribers?.length || 0,
      execution_time_ms: Date.now() - start
    }));

    return new Response(
      JSON.stringify({ users }),
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