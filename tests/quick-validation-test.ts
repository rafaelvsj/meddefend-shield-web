#!/usr/bin/env -S deno run --allow-net --allow-read

/**
 * TESTE RÁPIDO DA PIPELINE ATUALIZADA COM OPENAI
 * Executa um teste básico para verificar se a integração está funcionando
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const SUPABASE_URL = 'https://zwgjnynnbxiomtnnvztt.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runQuickTest() {
  console.log('🧪 TESTE RÁPIDO DA PIPELINE UNIVERSAL COM OPENAI\n');

  try {
    // 1. Verificar se o microserviço Python está rodando
    console.log('🔍 Verificando microserviço Python...');
    try {
      const healthResponse = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log(`✅ Microserviço ativo: ${health.status || 'OK'}`);
      } else {
        console.log(`⚠️  Microserviço responde com status ${healthResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Microserviço indisponível: ${error.message}`);
      console.log('   Execute o microserviço Python antes de continuar:');
      console.log('   cd supabase/functions/document-extract-service');
      console.log('   python -m uvicorn main:app --host 0.0.0.0 --port 8000');
      return;
    }

    // 2. Verificar configurações da pipeline
    console.log('\n⚙️  Verificando configurações...');
    const { data: settings } = await supabase
      .from('pipeline_settings')
      .select('setting_key, setting_value');

    const config = settings?.reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value;
      return acc;
    }, {});

    console.log(`   USE_UNIVERSAL_PIPELINE: ${config?.USE_UNIVERSAL_PIPELINE || 'NOT SET'}`);
    console.log(`   SIMILARITY_THRESHOLD: ${config?.SIMILARITY_THRESHOLD || 'NOT SET'}`);
    console.log(`   CHUNK_SIZE: ${config?.CHUNK_SIZE || 'NOT SET'}`);
    console.log(`   EXTRACTOR_SERVICE_URL: ${config?.EXTRACTOR_SERVICE_URL || 'NOT SET'}`);

    if (config?.USE_UNIVERSAL_PIPELINE !== 'true') {
      console.log('❌ Pipeline universal não está habilitada');
      return;
    }

    // 3. Criar documento de teste simples
    console.log('\n📄 Criando documento de teste...');
    const testContent = `DOCUMENTO DE TESTE MÉDICO - ${new Date().toISOString()}

RELATÓRIO CARDIOLÓGICO

Paciente: Teste Pipeline
Data: ${new Date().toLocaleDateString('pt-BR')}

HISTÓRICO:
O paciente apresenta sintomas cardiovasculares que requerem análise detalhada.
Este documento serve para testar a pipeline de ingestão universal do MedDefend.

DIAGNÓSTICO:
Teste de integração com OpenAI para geração de embeddings.
O sistema deve processar este texto, extrair em markdown e gerar chunks.

OBSERVAÇÕES:
Este conteúdo deve atingir similaridade ≥ 0.99 após processamento.
Embeddings devem ser gerados usando text-embedding-3-large.

Fim do documento de teste.`;

    // 4. Upload do arquivo
    const fileName = `quick-test-${Date.now()}.txt`;
    console.log(`   📤 Upload: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-base')
      .upload(fileName, new Blob([testContent], { type: 'text/plain' }));

    if (uploadError) {
      console.log(`❌ Erro no upload: ${uploadError.message}`);
      return;
    }

    // 5. Criar registro na knowledge_base
    console.log('   📝 Criando registro na knowledge_base...');
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_base')
      .insert({
        file_name: fileName,
        original_name: 'teste-pipeline-openai.txt',
        file_type: 'txt',
        mime_type: 'text/plain',
        file_size: testContent.length,
        status: 'pending'
      })
      .select()
      .single();

    if (kbError) {
      console.log(`❌ Erro ao criar registro: ${kbError.message}`);
      return;
    }

    const fileId = kbData.id;
    console.log(`   🆔 File ID criado: ${fileId}`);

    // 6. Invocar document-processor-v2
    console.log('   ⚡ Invocando document-processor-v2 com OpenAI...');
    const startTime = Date.now();
    
    const { data: processingResult, error: processingError } = await supabase.functions
      .invoke('document-processor-v2', {
        body: { fileId }
      });

    const duration = Date.now() - startTime;

    if (processingError) {
      console.log(`❌ Erro no processamento: ${processingError.message}`);
      return;
    }

    console.log(`   ⏱️  Duração do processamento: ${duration}ms`);

    if (!processingResult?.success) {
      console.log(`❌ Processamento falhou: ${processingResult?.error || processingResult?.message || 'Erro desconhecido'}`);
      return;
    }

    // 7. Verificar resultados
    console.log('\n📊 Verificando resultados...');
    
    const { data: finalKbData } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    const { data: chunks, count: chunkCount } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact' })
      .eq('knowledge_base_id', fileId);

    const { data: logs } = await supabase
      .from('kb_processing_logs')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    console.log(`   Status: ${finalKbData?.status || 'UNKNOWN'}`);
    console.log(`   Similaridade: ${finalKbData?.similarity_score || 'NULL'}`);
    console.log(`   Chunks criados: ${chunkCount || 0}`);
    console.log(`   Logs de processamento: ${logs?.length || 0}`);

    if (logs && logs.length > 0) {
      console.log('\n📋 Logs do processamento:');
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.stage}: ${log.message}`);
      });
    }

    // 8. Validar se passou no teste
    const success = finalKbData?.status === 'processed' && 
                   finalKbData?.similarity_score >= 0.99 && 
                   (chunkCount || 0) > 0;

    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 TESTE APROVADO - PIPELINE FUNCIONANDO COM OPENAI!');
      console.log(`   ✅ Status: ${finalKbData?.status}`);
      console.log(`   ✅ Similaridade: ${finalKbData?.similarity_score}`);
      console.log(`   ✅ Chunks: ${chunkCount}`);
      console.log(`   ✅ Duração: ${duration}ms`);
    } else {
      console.log('❌ TESTE FALHOU - REVISAR CONFIGURAÇÕES');
      if (finalKbData?.status !== 'processed') {
        console.log(`   Status incorreto: ${finalKbData?.status}`);
      }
      if ((finalKbData?.similarity_score || 0) < 0.99) {
        console.log(`   Similaridade baixa: ${finalKbData?.similarity_score}`);
      }
      if ((chunkCount || 0) === 0) {
        console.log(`   Nenhum chunk criado`);
      }
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.log(`\n❌ ERRO GERAL: ${error.message}`);
    console.log(error.stack);
  }
}

if (import.meta.main) {
  await runQuickTest();
}