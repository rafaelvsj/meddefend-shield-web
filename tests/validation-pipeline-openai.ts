#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

/**
 * VALIDAÇÃO DA PIPELINE UNIVERSAL COM OPENAI
 * 
 * Este script testa a pipeline atualizada com OpenAI:
 * 1. Cria documentos de teste (PDF e DOCX simulados)
 * 2. Faz upload para Supabase Storage
 * 3. Cria registros na knowledge_base
 * 4. Invoca document-processor-v2
 * 5. Valida resultados nas tabelas
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const SUPABASE_URL = 'https://zwgjnynnbxiomtnnvztt.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TestResult {
  format: string;
  status: 'passed' | 'failed';
  fileId?: string;
  similarity?: number;
  chunks?: number;
  error?: string;
  duration?: number;
}

class PipelineValidator {
  private results: TestResult[] = [];

  async runValidation(): Promise<void> {
    console.log('🚀 INICIANDO VALIDAÇÃO DA PIPELINE UNIVERSAL COM OPENAI\n');
    
    // Verificar se o microserviço Python está rodando
    await this.checkPythonService();
    
    // Verificar configurações da pipeline
    await this.checkPipelineSettings();
    
    // Executar testes
    const testCases = [
      { name: 'PDF', content: this.createPDFTestContent() },
      { name: 'DOCX', content: this.createDOCXTestContent() }
    ];

    for (const testCase of testCases) {
      console.log(`\n📄 Testando formato: ${testCase.name}`);
      await this.testSingleFormat(testCase);
    }

    this.printFinalReport();
  }

  private async checkPythonService(): Promise<void> {
    try {
      console.log('🔍 Verificando microserviço Python...');
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        const health = await response.json();
        console.log(`✅ Microserviço ativo: ${health.status}`);
        console.log(`   Formatos suportados: ${health.supported_formats?.length || 0}`);
      } else {
        throw new Error(`Status ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  Microserviço indisponível: ${error.message}`);
      console.log('   Verifique se está rodando em localhost:8000');
    }
  }

  private async checkPipelineSettings(): Promise<void> {
    console.log('⚙️  Verificando configurações da pipeline...');
    
    const { data: settings } = await supabase
      .from('pipeline_settings')
      .select('setting_key, setting_value');

    const config = settings?.reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value;
      return acc;
    }, {});

    console.log(`   USE_UNIVERSAL_PIPELINE: ${config?.USE_UNIVERSAL_PIPELINE}`);
    console.log(`   CHUNK_SIZE: ${config?.CHUNK_SIZE}`);
    console.log(`   SIMILARITY_THRESHOLD: ${config?.SIMILARITY_THRESHOLD}`);
    console.log(`   EXTRACTOR_SERVICE_URL: ${config?.EXTRACTOR_SERVICE_URL}`);
  }

  private async testSingleFormat(testCase: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 1. Upload do arquivo
      console.log('   📤 Fazendo upload...');
      const fileName = `test-${testCase.name.toLowerCase()}-${Date.now()}.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testCase.content], { type: 'text/plain' }));

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

      // 2. Criar registro na knowledge_base
      console.log('   📝 Criando registro na KB...');
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: `test-document.${testCase.name.toLowerCase()}`,
          file_type: testCase.name.toLowerCase(),
          mime_type: 'text/plain',
          file_size: testCase.content.length,
          status: 'pending',
          created_by: null
        })
        .select()
        .single();

      if (kbError) throw new Error(`KB insert falhou: ${kbError.message}`);

      const fileId = kbData.id;
      console.log(`   🆔 File ID: ${fileId}`);

      // 3. Invocar document-processor-v2
      console.log('   ⚡ Invocando document-processor-v2...');
      const { data: processingResult, error: processingError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId }
        });

      if (processingError) {
        throw new Error(`Processing falhou: ${processingError.message}`);
      }

      if (!processingResult?.success) {
        throw new Error(`Processing retornou erro: ${processingResult?.error || 'Desconhecido'}`);
      }

      // 4. Verificar resultado na KB
      console.log('   🔍 Verificando resultados...');
      const { data: finalKbData } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', fileId)
        .single();

      // 5. Verificar chunks criados
      const { data: chunks, count: chunkCount } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact' })
        .eq('knowledge_base_id', fileId);

      // 6. Verificar logs
      const { data: logs } = await supabase
        .from('kb_processing_logs')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: true });

      const duration = Date.now() - startTime;

      console.log(`   ✅ Status: ${finalKbData?.status}`);
      console.log(`   📊 Similaridade: ${finalKbData?.similarity_score}`);
      console.log(`   🧩 Chunks criados: ${chunkCount}`);
      console.log(`   ⏱️  Duração: ${duration}ms`);
      console.log(`   📋 Logs: ${logs?.length} entradas`);

      if (logs) {
        logs.forEach(log => {
          console.log(`      ${log.stage}: ${log.message}`);
        });
      }

      this.results.push({
        format: testCase.name,
        status: finalKbData?.status === 'processed' ? 'passed' : 'failed',
        fileId,
        similarity: finalKbData?.similarity_score,
        chunks: chunkCount || 0,
        duration
      });

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      
      this.results.push({
        format: testCase.name,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  private createPDFTestContent(): string {
    return `DOCUMENTO DE TESTE PDF - CARDIOLOGIA CLÍNICA

RELATÓRIO MÉDICO CARDÍACO

Paciente: João Silva
Data: ${new Date().toLocaleDateString('pt-BR')}
CRM: 12345

ANAMNESE:
Paciente masculino, 45 anos, apresenta dor torácica há 3 dias, de caráter opressivo, irradiando para membro superior esquerdo. Refere dispneia aos moderados esforços e palpitações ocasionais.

EXAME FÍSICO:
- PA: 140/90 mmHg
- FC: 88 bpm
- FR: 16 ipm
- Ausculta cardíaca: Bulhas rítmicas, normofonéticas, sem sopros
- Ausculta pulmonar: Murmúrio vesicular presente bilateralmente

HIPÓTESES DIAGNÓSTICAS:
1. Síndrome coronariana aguda
2. Angina estável
3. Hipertensão arterial sistêmica

CONDUTA:
- ECG de 12 derivações
- Dosagem de troponinas
- Ecocardiograma
- Prescrição de AAS 100mg/dia
- Retorno em 48h

Este documento contém informações médicas relevantes para análise pela inteligência artificial do sistema MedDefend, que deve processar o conteúdo, extrair em formato markdown e gerar embeddings para consulta posterior.`;
  }

  private createDOCXTestContent(): string {
    return `PROTOCOLO CLÍNICO DOCX - NEUROLOGIA

AVALIAÇÃO NEUROLÓGICA COMPLETA

Data: ${new Date().toLocaleDateString('pt-BR')}
Médico: Dra. Maria Santos
Especialidade: Neurologia

DADOS DO PACIENTE:
Nome: Ana Costa
Idade: 52 anos
Queixa principal: Cefaleia intensa há 5 dias

HISTÓRIA DA DOENÇA ATUAL:
Paciente refere cefaleia de início súbito, holocraniana, pulsátil, de forte intensidade (8/10), associada a fotofobia, fonofobia e náuseas. Nega febre, rigidez de nuca ou alterações visuais.

EXAME NEUROLÓGICO:
- Consciente, orientada no tempo e espaço
- Pupilas isocóricas e fotorreagentes
- Motricidade preservada em quatro membros
- Reflexos osteotendinosos simétricos e presentes
- Sinal de Babinski ausente bilateralmente
- Coordenação e equilíbrio preservados

PROPEDÊUTICA:
1. Tomografia computadorizada de crânio
2. Ressonância magnética de encéfalo
3. Punção lombar se necessário

PRESCRIÇÕES:
- Dipirona 500mg, 1 comprimido de 6/6h
- Domperidona 10mg, 1 comprimido antes das refeições
- Repouso em ambiente escuro e silencioso

ORIENTAÇÕES:
Retornar imediatamente se apresentar piora do quadro, alterações visuais, vômitos persistentes ou alterações do nível de consciência.

O sistema MedDefend deve processar este documento neurológico, convertendo-o em markdown estruturado e criando embeddings semânticos para facilitar buscas e análises futuras por IA médica especializada.`;
  }

  private printFinalReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DA VALIDAÇÃO');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'passed');
    const failed = this.results.filter(r => r.status === 'failed');

    console.log(`\n✅ Testes aprovados: ${passed.length}`);
    console.log(`❌ Testes falharam: ${failed.length}`);
    console.log(`📈 Taxa de sucesso: ${((passed.length / this.results.length) * 100).toFixed(1)}%`);

    if (passed.length > 0) {
      console.log('\n🎉 TESTES APROVADOS:');
      passed.forEach(result => {
        console.log(`   ${result.format}: ID=${result.fileId}, Similarity=${result.similarity}, Chunks=${result.chunks}, Duration=${result.duration}ms`);
      });
    }

    if (failed.length > 0) {
      console.log('\n💥 TESTES FALHARAM:');
      failed.forEach(result => {
        console.log(`   ${result.format}: ${result.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    if (failed.length === 0) {
      console.log('🚀 IMPLEMENTAÇÃO COMPLETA, TESTES PASSARAM – PRONTO PARA AVALIAÇÃO HUMANA');
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM – REVISAR CONFIGURAÇÕES');
    }
  }
}

// Executar validação
if (import.meta.main) {
  const validator = new PipelineValidator();
  await validator.runValidation();
}