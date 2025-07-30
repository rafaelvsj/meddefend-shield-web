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

    if (req.method === "GET") {
      // Get current settings from llm_settings table (fallback for system settings)
      const { data: settings } = await supabaseClient
        .from("llm_settings")
        .select("*");

      // Convert to key-value format
      const settingsMap = settings?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      // Add default values if missing
      const defaultSettings = {
        system_name: "MedDefend Admin",
        admin_email: "admin@meddefend.com",
        maintenance_mode: "false",
        auto_retry_analyses: "true",
        max_retry_attempts: "3",
        request_timeout: "30",
        require_2fa: "false",
        session_timeout: "true",
        session_duration: "8"
      };

      const finalSettings = { ...defaultSettings, ...settingsMap };

      return new Response(
        JSON.stringify({ settings: finalSettings }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );

    } else if (req.method === "POST") {
      const { settings } = await req.json();

      // Update settings in llm_settings table
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value as string,
        description: `System setting: ${key}`,
        updated_by: user.id
      }));

      for (const update of updates) {
        await supabaseClient
          .from("llm_settings")
          .upsert(update, { onConflict: "setting_key" });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Settings updated successfully" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error managing system settings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});