import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[test-knowledge-config] Recebida requisição: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Teste 1: Variáveis de ambiente do Supabase
    console.log('[test-knowledge-config] Testando variáveis de ambiente do Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      results.tests.push({
        name: 'Supabase Environment',
        status: 'FAIL',
        message: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas'
      });
    } else {
      results.tests.push({
        name: 'Supabase Environment',
        status: 'PASS',
        message: 'Variáveis do Supabase configuradas corretamente'
      });
    }

    // Teste 2: Conexão com Supabase
    console.log('[test-knowledge-config] Testando conexão com Supabase...');
    try {
      const supabaseClient = createClient(supabaseUrl || '', supabaseKey || '');
      
      const { data, error } = await supabaseClient
        .from('knowledge_base')
        .select('count')
        .limit(1);

      if (error) {
        results.tests.push({
          name: 'Supabase Connection',
          status: 'FAIL',
          message: `Erro na conexão: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Supabase Connection',
          status: 'PASS',
          message: 'Conexão com banco de dados funcionando'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Supabase Connection',
        status: 'FAIL',
        message: `Erro na conexão: ${error.message}`
      });
    }

    // Teste 3: Storage knowledge-base
    console.log('[test-knowledge-config] Testando acesso ao storage...');
    try {
      const supabaseClient = createClient(supabaseUrl || '', supabaseKey || '');
      
      const { data, error } = await supabaseClient.storage
        .from('knowledge-base')
        .list('', { limit: 1 });

      if (error) {
        results.tests.push({
          name: 'Storage Access',
          status: 'FAIL',
          message: `Erro no storage: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Storage Access',
          status: 'PASS',
          message: 'Acesso ao bucket knowledge-base funcionando'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Storage Access',
        status: 'FAIL',
        message: `Erro no storage: ${error.message}`
      });
    }

    // Teste 4: GEMINI_API_KEY
    console.log('[test-knowledge-config] Testando GEMINI_API_KEY...');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      results.tests.push({
        name: 'GEMINI_API_KEY',
        status: 'FAIL',
        message: 'GEMINI_API_KEY não configurada. Configure nas secrets do Supabase.',
        action_required: 'CONFIGURE_GEMINI_KEY'
      });
    } else {
      // Testar conectividade com a API do Gemini
      try {
        console.log('[test-knowledge-config] Testando conectividade com API Gemini...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: 'teste de configuração' }] }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.embedding?.values?.length > 0) {
            results.tests.push({
              name: 'GEMINI_API_KEY',
              status: 'PASS',
              message: `API Gemini funcionando. Embedding gerado com ${data.embedding.values.length} dimensões.`
            });
          } else {
            results.tests.push({
              name: 'GEMINI_API_KEY',
              status: 'FAIL',
              message: 'API Gemini respondeu mas não gerou embedding válido'
            });
          }
        } else {
          const errorText = await response.text();
          results.tests.push({
            name: 'GEMINI_API_KEY',
            status: 'FAIL',
            message: `Erro na API Gemini (${response.status}): ${errorText}`
          });
        }
      } catch (error) {
        results.tests.push({
          name: 'GEMINI_API_KEY',
          status: 'FAIL',
          message: `Erro ao testar API Gemini: ${error.message}`
        });
      }
    }

    // Teste 5: Tabela document_chunks
    console.log('[test-knowledge-config] Testando tabela document_chunks...');
    try {
      const supabaseClient = createClient(supabaseUrl || '', supabaseKey || '');
      
      const { data, error } = await supabaseClient
        .from('document_chunks')
        .select('count')
        .limit(1);

      if (error) {
        results.tests.push({
          name: 'Document Chunks Table',
          status: 'FAIL',
          message: `Erro na tabela document_chunks: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Document Chunks Table',
          status: 'PASS',
          message: 'Tabela document_chunks acessível'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Document Chunks Table',
        status: 'FAIL',
        message: `Erro ao acessar document_chunks: ${error.message}`
      });
    }

    // Resumo dos testes
    const passedTests = results.tests.filter(t => t.status === 'PASS').length;
    const failedTests = results.tests.filter(t => t.status === 'FAIL').length;
    const totalTests = results.tests.length;

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      status: failedTests === 0 ? 'ALL_PASS' : 'SOME_FAIL'
    };

    console.log(`[test-knowledge-config] Testes concluídos: ${passedTests}/${totalTests} passaram`);

    // Verificar se há ações necessárias
    const actionsRequired = results.tests
      .filter(t => t.action_required)
      .map(t => t.action_required);

    if (actionsRequired.length > 0) {
      results.actions_required = actionsRequired;
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[test-knowledge-config] Erro fatal:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});