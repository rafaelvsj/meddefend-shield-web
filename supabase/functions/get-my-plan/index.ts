// FASE 2: Edge Function "get-my-plan" - leitura direta da fonte de verdade

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  
  try {
    console.log(`[GET-MY-PLAN] Request started - ${requestId}`);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client (anon client for auth)
    const supabaseAnon = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log(`[GET-MY-PLAN] Auth failed - ${requestId}:`, authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[GET-MY-PLAN] User authenticated - ${requestId}:`, user.id);

    // Create service client for DB operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Use the canonical function to get user plan
    const { data: planData, error: planError } = await supabaseService
      .rpc('get_user_plan', { target_user_id: user.id });

    if (planError) {
      console.error(`[GET-MY-PLAN] Database error - ${requestId}:`, planError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch plan data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract plan data (function returns array, we need first element)
    const userPlan = planData && planData.length > 0 ? planData[0] : {
      plan: 'free',
      plan_level: 1,
      subscribed: false,
      is_comp: false,
      updated_at: null
    };

    console.log(`[GET-MY-PLAN] Plan retrieved - ${requestId}:`, userPlan);

    return new Response(
      JSON.stringify({
        ...userPlan,
        requestId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[GET-MY-PLAN] Unexpected error - ${requestId}:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        plan: 'free',
        plan_level: 1,
        subscribed: false,
        is_comp: false,
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});