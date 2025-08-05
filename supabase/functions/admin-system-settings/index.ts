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
        function: 'admin-system-settings',
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
        function: 'admin-system-settings',
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
        function: 'admin-system-settings',
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

    if (req.method === "GET") {
      // Get current settings from llm_settings table using service client
      const { data: settings, error: settingsError } = await serviceClient
        .from("llm_settings")
        .select("*");

      if (settingsError) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          function: 'admin-system-settings',
          admin_id: user.id,
          action: 'fetch_settings',
          status: 'error',
          error: settingsError.message
        }));
        throw settingsError;
      }

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

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-system-settings',
        admin_id: user.id,
        action: 'get_settings',
        status: 'success',
        settings_count: Object.keys(finalSettings).length,
        execution_time_ms: Date.now() - start
      }));

      return new Response(
        JSON.stringify({ settings: finalSettings }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );

    } else if (req.method === "POST") {
      const { settings } = await req.json();

      // Validate input
      if (!settings || typeof settings !== 'object') {
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Update settings in llm_settings table using service client
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value as string,
        description: `System setting: ${key}`,
        updated_by: user.id
      }));

      for (const update of updates) {
        const { error } = await serviceClient
          .from("llm_settings")
          .upsert(update, { onConflict: "setting_key" });
        
        if (error) {
          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            function: 'admin-system-settings',
            admin_id: user.id,
            action: 'update_setting',
            status: 'error',
            error: error.message,
            setting_key: update.setting_key
          }));
          throw error;
        }
      }

      // Log successful update
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'admin-system-settings',
        admin_id: user.id,
        action: 'update_settings',
        status: 'success',
        updates_count: updates.length,
        execution_time_ms: Date.now() - start
      }));

      // Create audit log
      await serviceClient
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "update_system_settings",
          resource_type: "system_settings",
          details: { updated_settings: updates }
        });

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