import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

async function cleanupAndTest() {
  console.log('🧹 LIMPEZA E TESTES DA PIPELINE\n');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Cleanup corrupted documents
  console.log('📋 Limpando documentos corrompidos...');
  const { data: cleanupResult } = await supabase.functions.invoke('cleanup-corrupted-docs');
  console.log('✅ Cleanup resultado:', cleanupResult);

  // Step 2: Check current state
  console.log('\n📊 Verificando estado atual...');
  
  const { data: kbData } = await supabase
    .from('knowledge_base')
    .select('id, status, file_name, similarity_score')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Knowledge Base:', kbData);

  const { data: chunksCount } = await supabase
    .from('document_chunks')
    .select('knowledge_base_id')
    .limit(1);
  
  console.log('Chunks existentes:', chunksCount?.length || 0);

  // Step 3: Check pipeline settings
  const { data: settings } = await supabase
    .from('pipeline_settings')
    .select('setting_key, setting_value');
  
  console.log('\n⚙️  Configurações da Pipeline:');
  settings?.forEach(s => console.log(`  ${s.setting_key}: ${s.setting_value}`));

  // Step 4: Test simple document upload and processing
  console.log('\n🧪 Testando upload e processamento simples...');
  
  const testContent = `TESTE DE PROCESSAMENTO

Este é um documento de teste para validar a pipeline de ingestão.
O conteúdo deve ser extraído corretamente e convertido para markdown.

Características testadas:
- Extração de texto
- Conversão para markdown  
- Geração de embeddings
- Criação de chunks

Resultado esperado: similarity_score ≥ 0.99`;

  const blob = new Blob([testContent], { type: 'text/plain' });
  const fileName = `test-cleanup-${Date.now()}.txt`;
  
  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('knowledge-base')
    .upload(fileName, blob);

  if (uploadError) {
    console.error('❌ Erro no upload:', uploadError);
    return false;
  }

  // Create KB entry
  const { data: kbEntry, error: insertError } = await supabase
    .from('knowledge_base')
    .insert({
      file_name: fileName,
      original_name: 'teste-cleanup.txt',
      file_type: 'txt',
      mime_type: 'text/plain',
      file_size: blob.size,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erro na inserção:', insertError);
    return false;
  }

  console.log('📄 Documento criado:', kbEntry.id);

  // Process document
  console.log('⚙️  Iniciando processamento...');
  const { data: processResult, error: processError } = await supabase.functions.invoke('document-processor-v2', {
    body: { fileId: kbEntry.id }
  });

  console.log('📊 Resultado do processamento:', processResult);
  if (processError) {
    console.error('❌ Erro no processamento:', processError);
    return false;
  }

  // Wait and check result
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { data: finalRecord } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('id', kbEntry.id)
    .single();

  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('knowledge_base_id', kbEntry.id);

  console.log('\n📋 RESULTADO FINAL:');
  console.log(`Status: ${finalRecord?.status}`);
  console.log(`Similaridade: ${finalRecord?.similarity_score}`);
  console.log(`Método: ${finalRecord?.extraction_method}`);
  console.log(`Chunks criados: ${chunks?.length || 0}`);

  const success = finalRecord?.status === 'processed' && 
                 finalRecord?.similarity_score >= 0.99 && 
                 chunks && chunks.length > 0;

  console.log(`\n${success ? '✅ TESTE PASSOU' : '❌ TESTE FALHOU'}`);
  return success;
}

if (import.meta.main) {
  const success = await cleanupAndTest();
  Deno.exit(success ? 0 : 1);
}