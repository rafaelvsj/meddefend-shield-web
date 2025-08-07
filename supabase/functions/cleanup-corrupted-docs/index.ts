import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update corrupted documents to discarded status
    const { data: updatedDocs, error } = await supabase
      .from('knowledge_base')
      .update({
        status: 'discarded',
        processing_logs: {
          discarded_reason: 'corrupted_legacy_document',
          discarded_at: new Date().toISOString(),
          pipeline: 'cleanup'
        }
      })
      .eq('status', 'error')
      .select();

    if (error) {
      throw error;
    }

    console.log(`Cleaned up ${updatedDocs?.length || 0} corrupted documents`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully discarded ${updatedDocs?.length || 0} corrupted documents`,
      discardedDocs: updatedDocs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});