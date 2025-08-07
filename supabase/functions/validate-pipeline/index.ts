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

    // Get pipeline settings
    const { data: settingsData } = await supabase
      .from('pipeline_settings')
      .select('setting_key, setting_value');

    const settings = settingsData?.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {}) || {};

    console.log('Pipeline settings:', settings);

    // Test extractor service connectivity
    let extractorStatus = 'unknown';
    let extractorError = null;
    
    if (settings.EXTRACTOR_SERVICE_URL) {
      try {
        const healthResponse = await fetch(`${settings.EXTRACTOR_SERVICE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (healthResponse.ok) {
          extractorStatus = 'healthy';
        } else {
          extractorStatus = 'unhealthy';
          extractorError = `HTTP ${healthResponse.status}`;
        }
      } catch (error) {
        extractorStatus = 'unreachable';
        extractorError = error.message;
      }
    } else {
      extractorStatus = 'not_configured';
    }

    // Check knowledge base status
    const { data: kbStats } = await supabase
      .from('knowledge_base')
      .select('status')
      .neq('status', 'discarded');

    const statusCounts = kbStats?.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Check logs
    const { data: recentLogs } = await supabase
      .from('kb_processing_logs')
      .select('stage, message, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Create a test document to validate pipeline
    const testContent = `DOCUMENTO TESTE PIPELINE UNIVERSAL

Este é um documento de teste criado automaticamente para validar o funcionamento do pipeline universal de processamento de documentos.

CARACTERÍSTICAS TESTADAS:
- Extração de texto simples
- Conversão para Markdown
- Cálculo de similaridade
- Geração de embeddings
- Divisão em chunks

CONTEÚDO MÉDICO DE EXEMPLO:
A medicina defensiva é uma prática médica caracterizada pela adoção de condutas clínicas adicionais com o objetivo primário de reduzir riscos de processos judiciais, mesmo quando tais condutas não são clinicamente necessárias para o cuidado adequado do paciente.

IMPACTOS OBSERVADOS:
• Solicitação excessiva de exames complementares
• Encaminhamentos desnecessários a especialistas
• Prolongamento inadequado de internações hospitalares  
• Aumento significativo dos custos assistenciais

Se este documento for processado com sucesso, o pipeline universal está funcionando corretamente.`;

    // Upload test file
    const testFileName = `pipeline-test-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-base')
      .upload(testFileName, new Blob([testContent], { type: 'text/plain' }));

    let testFileId = null;
    let processingResult = null;

    if (!uploadError) {
      // Create knowledge base entry
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: testFileName,
          original_name: 'pipeline-test.txt',
          file_type: 'txt',
          file_size: testContent.length,
          status: 'pending'
        })
        .select()
        .single();

      if (!kbError && kbData) {
        testFileId = kbData.id;
        
        // Only attempt processing if extractor service is healthy
        if (extractorStatus === 'healthy') {
          try {
            const { data: processData, error: processError } = await supabase.functions
              .invoke('document-processor-v2', {
                body: { fileId: kbData.id }
              });

            processingResult = {
              success: !processError,
              data: processData,
              error: processError?.message
            };
          } catch (error) {
            processingResult = {
              success: false,
              error: `Processing failed: ${error.message}`
            };
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      pipeline_status: {
        universal_enabled: settings.USE_UNIVERSAL_PIPELINE === 'true',
        similarity_threshold: settings.SIMILARITY_THRESHOLD,
        extractor_service: {
          url: settings.EXTRACTOR_SERVICE_URL,
          status: extractorStatus,
          error: extractorError
        }
      },
      knowledge_base: {
        document_counts: statusCounts,
        total_active: Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0)
      },
      recent_logs: recentLogs?.slice(0, 5) || [],
      test_execution: {
        file_id: testFileId,
        upload_success: !uploadError,
        upload_error: uploadError?.message,
        processing_result: processingResult
      },
      recommendations: extractorStatus !== 'healthy' ? [
        'Configure and start the document extraction microservice',
        'Ensure EXTRACTOR_SERVICE_URL points to a running service',
        'Check service logs for any startup issues'
      ] : [
        'Pipeline is configured and ready for testing',
        'Upload documents to validate end-to-end processing',
        'Monitor logs for processing status and errors'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Pipeline validation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});