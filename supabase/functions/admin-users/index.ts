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

    // Get users with their profiles, roles and subscriptions
    const { data: users, error } = await supabaseClient
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