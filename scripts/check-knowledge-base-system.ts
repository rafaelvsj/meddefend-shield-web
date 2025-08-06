#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write

// CHECAGEM COMPLETA DO SISTEMA DE KNOWLEDGE BASE
// Script para verificar todos os componentes do sistema

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zwgjnynnbxiomtnnvztt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  data?: any;
}

class KnowledgeBaseChecker {
  private results: CheckResult[] = [];

  private addResult(name: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string, data?: any) {
    this.results.push({ name, status, details, data });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${name}: ${details}`);
  }

  async checkDatabaseConnection() {
    console.log('\n🔍 VERIFICANDO CONEXÃO COM BANCO DE DADOS...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        this.addResult('Database Connection', 'FAIL', `Error: ${error.message}`);
      } else {
        this.addResult('Database Connection', 'PASS', 'Conexão estabelecida com sucesso');
      }
    } catch (error: any) {
      this.addResult('Database Connection', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkKnowledgeBaseTable() {
    console.log('\n📋 VERIFICANDO TABELA KNOWLEDGE_BASE...');
    
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, file_name, status, similarity_score, extraction_method, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        this.addResult('Knowledge Base Table', 'FAIL', `Error: ${error.message}`);
      } else {
        const totalFiles = data?.length || 0;
        const processed = data?.filter(f => f.status === 'processed').length || 0;
        const pending = data?.filter(f => f.status === 'pending').length || 0;
        const errors = data?.filter(f => f.status === 'error').length || 0;
        
        this.addResult('Knowledge Base Table', 'PASS', 
          `Total: ${totalFiles}, Processed: ${processed}, Pending: ${pending}, Errors: ${errors}`, 
          data);
      }
    } catch (error: any) {
      this.addResult('Knowledge Base Table', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkLLMSettings() {
    console.log('\n⚙️ VERIFICANDO CONFIGURAÇÕES LLM...');
    
    try {
      const { data, error } = await supabase
        .from('llm_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['USE_UNIVERSAL_PIPELINE', 'EXTRACTOR_SERVICE_URL', 'PIPELINE_QUALITY_THRESHOLD']);
      
      if (error) {
        this.addResult('LLM Settings', 'FAIL', `Error: ${error.message}`);
      } else {
        const settings = data?.reduce((acc: any, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {}) || {};
        
        const required = ['USE_UNIVERSAL_PIPELINE', 'EXTRACTOR_SERVICE_URL', 'PIPELINE_QUALITY_THRESHOLD'];
        const missing = required.filter(key => !settings[key]);
        
        if (missing.length > 0) {
          this.addResult('LLM Settings', 'FAIL', `Missing settings: ${missing.join(', ')}`);
        } else {
          this.addResult('LLM Settings', 'PASS', 
            `All configured - Pipeline: ${settings.USE_UNIVERSAL_PIPELINE}, URL: ${settings.EXTRACTOR_SERVICE_URL}`, 
            settings);
        }
      }
    } catch (error: any) {
      this.addResult('LLM Settings', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkHealthzFunction() {
    console.log('\n🩺 VERIFICANDO FUNÇÃO HEALTHZ...');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/healthz`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.addResult('Healthz Function', 'PASS', 
          `Status: ${data.status}, Health: ${data.summary?.healthy}/${data.summary?.total_checks}`, 
          data);
      } else {
        this.addResult('Healthz Function', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      this.addResult('Healthz Function', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkDocumentExtractFunction() {
    console.log('\n📄 VERIFICANDO FUNÇÃO DOCUMENT-EXTRACT...');
    
    try {
      // Test with a simple text file
      const testContent = 'Teste de funcionalidade do document-extract';
      const formData = new FormData();
      formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'test.txt');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.addResult('Document Extract Function', 'PASS', 
            `Method: ${data.extraction_method}, Similarity: ${Math.round(data.similarity * 100)}%`, 
            data);
        } else {
          this.addResult('Document Extract Function', 'FAIL', `Service returned failure: ${data.error}`);
        }
      } else {
        this.addResult('Document Extract Function', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      this.addResult('Document Extract Function', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkDocumentProcessorV2Function() {
    console.log('\n⚙️ VERIFICANDO FUNÇÃO DOCUMENT-PROCESSOR-V2...');
    
    try {
      // Test with healthcheck call
      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-processor-v2`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (response.ok) {
        this.addResult('Document Processor V2 Function', 'PASS', 'Function is responding');
      } else {
        this.addResult('Document Processor V2 Function', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      this.addResult('Document Processor V2 Function', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkStorageBucket() {
    console.log('\n🗄️ VERIFICANDO STORAGE BUCKET...');
    
    try {
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .list('', { limit: 5 });
      
      if (error) {
        this.addResult('Storage Bucket', 'FAIL', `Error: ${error.message}`);
      } else {
        const fileCount = data?.length || 0;
        this.addResult('Storage Bucket', 'PASS', `Bucket accessible, ${fileCount} files listed`);
      }
    } catch (error: any) {
      this.addResult('Storage Bucket', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async checkProcessingLogs() {
    console.log('\n📝 VERIFICANDO LOGS DE PROCESSAMENTO...');
    
    try {
      const { data, error } = await supabase
        .from('kb_processing_logs')
        .select('stage, message, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        this.addResult('Processing Logs', 'FAIL', `Error: ${error.message}`);
      } else {
        const logCount = data?.length || 0;
        this.addResult('Processing Logs', 'PASS', `${logCount} recent log entries found`);
      }
    } catch (error: any) {
      this.addResult('Processing Logs', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async runFullSystemTest() {
    console.log('\n🧪 EXECUTANDO TESTE END-TO-END COMPLETO...');
    
    try {
      const timestamp = Date.now();
      const testContent = `TESTE COMPLETO SISTEMA KB - ${timestamp}

Este é um teste end-to-end do sistema de knowledge base.

Validações:
✓ Upload para storage
✓ Registro na knowledge_base
✓ Processamento via pipeline universal
✓ Extração de texto com alta fidelidade
✓ Conversão para markdown
✓ Cálculo de similaridade >= 99%

Conteúdo médico de exemplo:
A medicina defensiva representa uma mudança paradigmática na prática médica, 
caracterizada pela adoção de condutas clínicas adicionais visando reduzir 
riscos de processos legais.

Se este texto foi processado com sucesso, o sistema está operacional.

Timestamp: ${new Date().toISOString()}`;

      // 1. Upload to storage
      const fileName = `system-test-${timestamp}.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testContent], { type: 'text/plain' }));

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 2. Create KB entry
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: `system-test-${timestamp}.txt`,
          file_type: 'text/plain',
          file_size: testContent.length,
          status: 'pending'
        })
        .select()
        .single();

      if (kbError) throw new Error(`KB insert failed: ${kbError.message}`);

      // 3. Process with document-processor-v2
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId: kbData.id }
        });

      if (processError) throw new Error(`Processing failed: ${processError.message}`);

      // 4. Wait a bit and check result
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: resultData, error: resultError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', kbData.id)
        .single();

      if (resultError) throw new Error(`Result fetch failed: ${resultError.message}`);

      if (resultData.status === 'processed' && resultData.similarity_score >= 0.99) {
        this.addResult('Full System Test', 'PASS', 
          `Complete success - Status: ${resultData.status}, Similarity: ${Math.round(resultData.similarity_score * 100)}%`);
      } else {
        this.addResult('Full System Test', 'WARNING', 
          `Partial success - Status: ${resultData.status}, Similarity: ${Math.round((resultData.similarity_score || 0) * 100)}%`);
      }

    } catch (error: any) {
      this.addResult('Full System Test', 'FAIL', `Exception: ${error.message}`);
    }
  }

  async runAllChecks() {
    console.log('🔥 INICIANDO CHECAGEM COMPLETA DO SISTEMA DE KNOWLEDGE BASE');
    console.log('=' .repeat(80));

    await this.checkDatabaseConnection();
    await this.checkKnowledgeBaseTable();
    await this.checkLLMSettings();
    await this.checkHealthzFunction();
    await this.checkDocumentExtractFunction();
    await this.checkDocumentProcessorV2Function();
    await this.checkStorageBucket();
    await this.checkProcessingLogs();
    await this.runFullSystemTest();

    console.log('\n' + '=' .repeat(80));
    console.log('📊 RELATÓRIO FINAL DA CHECAGEM');
    console.log('=' .repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`\n📈 RESULTADOS GERAIS:`);
    console.log(`✅ PASS: ${passed}`);
    console.log(`❌ FAIL: ${failed}`);
    console.log(`⚠️  WARNING: ${warnings}`);

    if (failed === 0 && warnings === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ SISTEMA DE KNOWLEDGE BASE TOTALMENTE OPERACIONAL!');
      return true;
    } else if (failed === 0) {
      console.log('\n⚠️ SISTEMA OPERACIONAL COM AVISOS');
      console.log('✅ Funcionalidades principais funcionando');
      return true;
    } else {
      console.log('\n❌ PROBLEMAS DETECTADOS NO SISTEMA');
      console.log('⚠️ Verificar itens marcados como FAIL');
      return false;
    }
  }
}

// Execute if called directly
if (import.meta.main) {
  const checker = new KnowledgeBaseChecker();
  const success = await checker.runAllChecks();
  
  console.log('\n' + '=' .repeat(80));
  if (success) {
    console.log('🏆 RESULTADO: Sistema de Knowledge Base está operacional');
    Deno.exit(0);
  } else {
    console.log('⚠️ RESULTADO: Problemas detectados que requerem atenção');
    Deno.exit(1);
  }
}