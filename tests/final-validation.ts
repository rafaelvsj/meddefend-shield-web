#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write

// TESTE FINAL DE VALIDAÇÃO DO PIPELINE UNIVERSAL
// Este script executa um teste completo end-to-end

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zwgjnynnbxiomtnnvztt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runFinalValidation() {
  console.log('🔥 INICIANDO VALIDAÇÃO FINAL DO PIPELINE UNIVERSAL');
  console.log('=' .repeat(80));
  
  const results = {
    healthCheck: false,
    settingsConfigured: false,
    extractionService: false,
    endToEndTest: false,
    overallSuccess: false
  };
  
  try {
    // 1. VERIFICAR HEALTH DO EXTRACTION SERVICE
    console.log('\n1️⃣ TESTANDO HEALTH DO EXTRACTION SERVICE...');
    try {
      const healthResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-extract`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (healthResponse.ok) {
        console.log('✅ Extraction service respondendo');
        results.healthCheck = true;
      } else {
        console.log(`❌ Extraction service erro: ${healthResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Extraction service inacessível: ${error.message}`);
    }
    
    // 2. VERIFICAR CONFIGURAÇÕES
    console.log('\n2️⃣ VERIFICANDO CONFIGURAÇÕES DO SISTEMA...');
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('llm_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['USE_UNIVERSAL_PIPELINE', 'EXTRACTOR_SERVICE_URL']);
      
      if (!settingsError && settings && settings.length >= 2) {
        console.log('✅ Configurações encontradas:');
        settings.forEach(setting => {
          console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
        });
        results.settingsConfigured = true;
      } else {
        console.log('❌ Configurações não encontradas ou incompletas');
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar configurações: ${error.message}`);
    }
    
    // 3. TESTAR EXTRACTION SERVICE DIRETAMENTE
    console.log('\n3️⃣ TESTANDO EXTRACTION SERVICE DIRETAMENTE...');
    try {
      const testContent = `Documento de Teste Final - Pipeline Universal

Este é um documento de teste para validação final do pipeline universal de processamento de documentos.

CARACTERÍSTICAS VALIDADAS:
- Extração de texto simples
- Conversão para markdown
- Cálculo de similaridade
- Processamento end-to-end

CONTEÚDO MÉDICO:
A medicina defensiva é caracterizada pela adoção de condutas clínicas adicionais com objetivo primário de reduzir riscos legais.

Se este texto for processado corretamente com similaridade ≥ 99%, o pipeline está operacional.`;

      const formData = new FormData();
      formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'test-final.txt');
      
      const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });
      
      if (extractResponse.ok) {
        const extractResult = await extractResponse.json();
        if (extractResult.success && extractResult.similarity >= 0.99) {
          console.log(`✅ Extraction service funcionando - Similaridade: ${Math.round(extractResult.similarity * 100)}%`);
          console.log(`   Método: ${extractResult.extraction_method}`);
          console.log(`   MIME: ${extractResult.mime_type}`);
          results.extractionService = true;
        } else {
          console.log(`❌ Extraction service com baixa qualidade: ${extractResult.similarity}`);
        }
      } else {
        const errorText = await extractResponse.text();
        console.log(`❌ Extraction service falhou: ${extractResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro no teste do extraction service: ${error.message}`);
    }
    
    // 4. TESTE END-TO-END COMPLETO
    console.log('\n4️⃣ EXECUTANDO TESTE END-TO-END COMPLETO...');
    try {
      const timestamp = Date.now();
      const fileName = `final-test-${timestamp}.txt`;
      const testContent = `TESTE FINAL PIPELINE UNIVERSAL - ${timestamp}

Este documento valida o funcionamento completo do pipeline universal de processamento.

VALIDAÇÕES:
✓ Upload para storage
✓ Criação de registro na knowledge_base  
✓ Processamento via document-processor-v2
✓ Extração de texto multi-formato
✓ Conversão para markdown
✓ Cálculo de similaridade ≥ 99%
✓ Criação de embeddings
✓ Status final: processed

CONTEÚDO TÉCNICO:
A medicina defensiva representa uma mudança paradigmática na prática médica contemporânea, caracterizada pela adoção sistemática de condutas clínicas adicionais que visam primariamente a redução de riscos de processos judiciais, mesmo quando tais condutas não apresentam indicação clínica específica ou benefício direto para o cuidado do paciente.

TIMESTAMP: ${new Date().toISOString()}
IDENTIFICADOR: ${timestamp}`;

      // Upload para storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testContent], { type: 'text/plain' }));
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      console.log('   ✅ Upload para storage concluído');
      
      // Criar registro na KB
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: `teste-final-${timestamp}.txt`,
          file_type: 'text/plain',
          file_size: testContent.length,
          status: 'pending'
        })
        .select()
        .single();
      
      if (kbError) throw new Error(`KB insert failed: ${kbError.message}`);
      console.log('   ✅ Registro na knowledge_base criado');
      
      // Processar com document-processor-v2
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId: kbData.id }
        });
      
      if (processError) throw new Error(`Processing failed: ${processError.message}`);
      console.log('   ✅ document-processor-v2 executado');
      
      // Verificar resultado final
      const { data: resultData, error: resultError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', kbData.id)
        .single();
      
      if (resultError) throw new Error(`Result check failed: ${resultError.message}`);
      
      if (resultData.status === 'processed' && resultData.similarity_score >= 0.99) {
        console.log(`   ✅ TESTE END-TO-END PASSOU!`);
        console.log(`   📊 Similaridade: ${Math.round(resultData.similarity_score * 100)}%`);
        console.log(`   🔧 Método: ${resultData.extraction_method}`);
        console.log(`   📄 Markdown gerado: ${resultData.markdown_content ? 'Sim' : 'Não'}`);
        results.endToEndTest = true;
      } else {
        console.log(`   ❌ Teste falhou - Status: ${resultData.status}, Similaridade: ${resultData.similarity_score}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro no teste end-to-end: ${error.message}`);
    }
    
    // 5. RESULTADO FINAL
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('=' .repeat(80));
    
    const checks = [
      { name: 'Health Check Extraction Service', status: results.healthCheck },
      { name: 'Configurações do Sistema', status: results.settingsConfigured },
      { name: 'Teste Direto Extraction Service', status: results.extractionService },
      { name: 'Teste End-to-End Completo', status: results.endToEndTest }
    ];
    
    console.log('\n🔍 CHECKLIST DE VALIDAÇÃO:');
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });
    
    const allPassed = checks.every(check => check.status);
    results.overallSuccess = allPassed;
    
    if (allPassed) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ PIPELINE UNIVERSAL ESTÁ OPERACIONAL!');
      console.log('\n📋 CRITÉRIOS ATENDIDOS:');
      console.log('• Extraction service respondendo');
      console.log('• Configurações corretas no banco');
      console.log('• Extração funcionando com similaridade ≥ 99%');
      console.log('• Processo end-to-end completo');
      console.log('• Documento real processado e marcado como "processed"');
      console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM');
      console.log('❌ Pipeline ainda não está totalmente operacional');
      console.log('\nVerificar itens marcados com ❌ acima');
    }
    
    console.log('\n' + '=' .repeat(80));
    
    return results;
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA VALIDAÇÃO:', error);
    return results;
  }
}

// Executar validação se chamado diretamente
if (import.meta.main) {
  const results = await runFinalValidation();
  
  if (results.overallSuccess) {
    console.log('\n🏆 RESULTADO: problema resolvido');
    Deno.exit(0);
  } else {
    console.log('\n⚠️ RESULTADO: ainda em progresso');
    Deno.exit(1);
  }
}