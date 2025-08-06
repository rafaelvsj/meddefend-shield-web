import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry automático para arquivos com erro
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente necessárias não encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action } = await req.json();

    console.log(`[retry-failed-documents] Ação solicitada: ${action}`);

    if (action === 'retry_failed') {
      // Buscar documentos com erro ou processando há mais de 10 minutos
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      const { data: failedDocs, error: queryError } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(`status.eq.error,and(status.eq.processing,created_at.lt.${tenMinutesAgo.toISOString()})`);

      if (queryError) {
        throw new Error(`Erro ao buscar documentos: ${queryError.message}`);
      }

      console.log(`[retry-failed-documents] Encontrados ${failedDocs?.length || 0} documentos para retry`);

      if (!failedDocs || failedDocs.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Nenhum documento necessita retry',
          retried_count: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Processar cada documento falhado
      const retryResults = [];
      
      for (const doc of failedDocs) {
        try {
          console.log(`[retry-failed-documents] Reprocessando: ${doc.original_name}`);
          
          // Resetar status para pending
          await supabase
            .from('knowledge_base')
            .update({ 
              status: 'pending', 
              processed_at: null 
            })
            .eq('id', doc.id);

          // Limpar chunks antigos se existirem
          await supabase
            .from('document_chunks')
            .delete()
            .eq('knowledge_base_id', doc.id);

          // Chamar processamento otimizado
          const { data: processData, error: processError } = await supabase.functions
            .invoke('process-document-optimized', {
              body: { fileId: doc.id }
            });

          if (processError) {
            console.error(`[retry-failed-documents] Erro ao reprocessar ${doc.original_name}:`, processError);
            
            // Marcar como erro novamente
            await supabase
              .from('knowledge_base')
              .update({ status: 'error' })
              .eq('id', doc.id);

            retryResults.push({
              file_name: doc.original_name,
              success: false,
              error: processError.message
            });
          } else {
            console.log(`[retry-failed-documents] Sucesso ao reprocessar ${doc.original_name}`);
            retryResults.push({
              file_name: doc.original_name,
              success: true
            });
          }

          // Pausa entre processamentos
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`[retry-failed-documents] Erro crítico com ${doc.original_name}:`, error);
          retryResults.push({
            file_name: doc.original_name,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = retryResults.filter(r => r.success).length;
      const failureCount = retryResults.filter(r => !r.success).length;

      return new Response(JSON.stringify({
        success: true,
        message: `Retry concluído: ${successCount} sucessos, ${failureCount} falhas`,
        retried_count: failedDocs.length,
        results: retryResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_failed_stats') {
      // Estatísticas de documentos falhados
      const { data: errorDocs, error: errorQuery } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('status', 'error');

      const { data: stuckDocs, error: stuckQuery } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (errorQuery || stuckQuery) {
        throw new Error('Erro ao buscar estatísticas');
      }

      return new Response(JSON.stringify({
        error_docs: errorDocs?.length || 0,
        stuck_docs: stuckDocs?.length || 0,
        total_needing_retry: (errorDocs?.length || 0) + (stuckDocs?.length || 0),
        error_files: errorDocs?.map(d => ({
          name: d.original_name,
          created_at: d.created_at,
          id: d.id
        })) || [],
        stuck_files: stuckDocs?.map(d => ({
          name: d.original_name,
          created_at: d.created_at,
          id: d.id
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[retry-failed-documents] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});