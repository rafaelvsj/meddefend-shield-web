import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[test-kb-insert] Iniciando teste de inserção na knowledge_base');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Testar inserção direta com service role
    console.log('[test-kb-insert] Inserindo registro de teste...');
    const { data: insertData, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        file_name: `teste-${Date.now()}.txt`,
        original_name: 'arquivo-teste.txt',
        file_type: 'text/plain',
        file_size: 123,
        status: 'pending',
        created_by: '00c6aaea-b6d3-466b-8a2b-8007769e312f'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[test-kb-insert] Erro na inserção:', insertError);
      throw insertError;
    }

    console.log('[test-kb-insert] Inserção bem-sucedida:', insertData);

    // 2. Verificar se o trigger funcionaria (simular)
    console.log('[test-kb-insert] Testando chamada para process-document...');
    const { data: processData, error: processError } = await supabase.functions
      .invoke('process-document', {
        body: { fileId: insertData.id }
      });

    if (processError) {
      console.error('[test-kb-insert] Erro no process-document:', processError);
    } else {
      console.log('[test-kb-insert] Process-document executado:', processData);
    }

    // 3. Verificar se o registro aparece na consulta
    const { data: selectData, error: selectError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (selectError) {
      console.error('[test-kb-insert] Erro na consulta:', selectError);
    } else {
      console.log('[test-kb-insert] Registro encontrado:', selectData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insert: insertData,
        process: processData,
        select: selectData,
        errors: {
          insert: insertError,
          process: processError,
          select: selectError
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[test-kb-insert] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});