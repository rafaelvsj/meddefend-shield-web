import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { queue } from "../_shared/queue.ts";
import { logger, withLogging } from "../_shared/logger.ts";
import { withSecurity } from "../_shared/security.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job handlers
async function processDocument(payload: Record<string, any>): Promise<void> {
  const { fileId, options = {} } = payload;
  
  logger.info('Processing document job', { fileId, options });
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Call process-document function
  const { data, error } = await supabase.functions.invoke('process-document', {
    body: { fileId, ...options }
  });

  if (error) {
    throw new Error(`Document processing failed: ${error.message}`);
  }

  logger.info('Document processing completed', { fileId, result: data });
}

async function complexAnalysis(payload: Record<string, any>): Promise<void> {
  const { analysisId, text, options = {} } = payload;
  
  logger.info('Processing complex analysis job', { analysisId, textLength: text?.length });
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Call analyze-text-v2 function
  const { data, error } = await supabase.functions.invoke('analyze-text-v2', {
    body: { text, ...options }
  });

  if (error) {
    throw new Error(`Complex analysis failed: ${error.message}`);
  }

  // Update analysis record if analysisId provided
  if (analysisId) {
    await supabase
      .from('user_analyses')
      .update({
        analysis_result: data,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);
  }

  logger.info('Complex analysis completed', { analysisId, result: data });
}

async function batchOperation(payload: Record<string, any>): Promise<void> {
  const { operation, items, options = {} } = payload;
  
  logger.info('Processing batch operation', { 
    operation, 
    itemCount: items?.length 
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let processed = 0;
  let failed = 0;

  for (const item of items || []) {
    try {
      switch (operation) {
        case 'backup_cleanup':
          // Cleanup old backups
          await supabase.functions.invoke('backup', {
            body: { action: 'cleanup', ...item }
          });
          break;
        
        case 'cache_cleanup':
          // Cleanup expired cache entries
          await supabase.rpc('cleanup_expired_cache');
          break;
        
        case 'metrics_aggregation':
          // Aggregate metrics data
          await supabase.functions.invoke('metrics', {
            body: { action: 'aggregate', ...item }
          });
          break;
        
        default:
          throw new Error(`Unknown batch operation: ${operation}`);
      }
      
      processed++;
    } catch (error) {
      logger.error('Batch operation item failed', { 
        operation, 
        item, 
        error: error.message 
      });
      failed++;
    }
  }

  logger.info('Batch operation completed', { 
    operation, 
    processed, 
    failed, 
    total: items?.length || 0 
  });
}

// Register job handlers
queue.registerHandler('document_processing', processDocument);
queue.registerHandler('complex_analysis', complexAnalysis);
queue.registerHandler('batch_operation', batchOperation);

const handler = withLogging('worker', async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action = 'process', batchSize = 10 } = await req.json().catch(() => ({}));

    let result;
    
    switch (action) {
      case 'process':
        const processed = await queue.processJobs(batchSize);
        result = { processed, batchSize };
        break;
      
      case 'stats':
        const stats = await queue.getStats();
        result = stats;
        break;
      
      case 'cleanup':
        const cleaned = await queue.cleanup();
        result = { cleaned };
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logger.error('Worker error', { error: error.message });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

serve(withSecurity('worker', handler));