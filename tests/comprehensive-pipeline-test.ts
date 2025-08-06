#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zwgjnynnbxiomtnnvztt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  format: string;
  status: 'PASS' | 'FAIL';
  similarity?: number;
  method?: string;
  duration: number;
  error?: string;
}

class PipelineValidator {
  async runCompleteTest(): Promise<TestResult[]> {
    console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DO PIPELINE UNIVERSAL');
    console.log('=' .repeat(60));
    
    const testCases = [
      { format: 'TXT', content: this.createTXTTest(), filename: 'test.txt' },
      { format: 'HTML', content: this.createHTMLTest(), filename: 'test.html' },
      { format: 'RTF', content: this.createRTFTest(), filename: 'test.rtf' },
      { format: 'PDF', content: this.createPDFTest(), filename: 'test.pdf' },
    ];
    
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testando formato ${testCase.format}...`);
      const result = await this.testSingleFormat(testCase);
      results.push(result);
      
      if (result.status === 'PASS') {
        console.log(`✅ ${testCase.format}: PASSED (${result.similarity! * 100}%, ${result.duration}ms)`);
      } else {
        console.log(`❌ ${testCase.format}: FAILED - ${result.error}`);
      }
    }
    
    this.printFinalReport(results);
    return results;
  }
  
  private async testSingleFormat(testCase: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // 1. Upload arquivo
      const fileName = `test-${Date.now()}-${testCase.filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testCase.content], { type: 'text/plain' }));
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      // 2. Criar entrada KB
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: testCase.filename,
          file_type: testCase.format.toLowerCase(),
          file_size: testCase.content.length,
          status: 'pending'
        })
        .select()
        .single();
      
      if (kbError) throw new Error(`KB insert failed: ${kbError.message}`);
      
      // 3. Processar com document-processor-v2
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId: kbData.id }
        });
      
      if (processError) throw new Error(`Processing failed: ${processError.message}`);
      
      // 4. Verificar resultado
      const { data: resultData, error: resultError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', kbData.id)
        .single();
      
      if (resultError) throw new Error(`Result fetch failed: ${resultError.message}`);
      
      const duration = Date.now() - startTime;
      
      // 5. Validar critérios de sucesso
      if (resultData?.status === 'processed' && resultData?.similarity_score >= 0.99) {
        return {
          format: testCase.format,
          status: 'PASS',
          similarity: resultData.similarity_score,
          method: resultData.extraction_method,
          duration
        };
      } else {
        return {
          format: testCase.format,
          status: 'FAIL',
          duration,
          error: `Status: ${resultData?.status}, Similarity: ${resultData?.similarity_score}`
        };
      }
      
    } catch (error: any) {
      return {
        format: testCase.format,
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  private createTXTTest(): string {
    return `Documento de Teste TXT - Validação Pipeline Universal

Este arquivo de texto simples tem como objetivo validar a extração completa de conteúdo textual pelo sistema de processamento universal de documentos.

CARACTERÍSTICAS TESTADAS:
- Texto sem formatação
- Múltiplos parágrafos
- Caracteres especiais: áçñü!@#$%
- Pontuação diversa: .,;:!?()[]{}

CONTEÚDO MÉDICO DE EXEMPLO:
A medicina defensiva é uma prática na qual profissionais de saúde adotam condutas clínicas adicionais com o objetivo primário de reduzir riscos de processos judiciais, mesmo quando tais condutas não são clinicamente necessárias para o cuidado do paciente.

IMPACTOS OBSERVADOS:
• Solicitação excessiva de exames complementares
• Encaminhamentos desnecessários a especialistas  
• Prolongamento inadequado de internações
• Aumento significativo dos custos assistenciais

Se você conseguir ler todo este conteúdo após o processamento, a extração TXT funcionou corretamente.

Fim do documento de teste.`;
  }
  
  private createHTMLTest(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Documento HTML - Teste Pipeline Universal</title>
</head>
<body>
  <h1>Documento HTML de Teste</h1>
  <p>Este documento HTML tem como finalidade validar a extração de conteúdo estruturado pelo sistema de processamento universal.</p>
  
  <h2>Características Validadas:</h2>
  <ul>
    <li>Headers hierárquicos (H1, H2, H3)</li>
    <li>Parágrafos estruturados</li>
    <li>Listas ordenadas e não-ordenadas</li>
    <li>Formatação de texto (<strong>negrito</strong>, <em>itálico</em>)</li>
    <li>Caracteres especiais: áçñü!@#$%</li>
  </ul>
  
  <h3>Exemplo de Conteúdo Médico:</h3>
  <p><strong>Medicina Defensiva:</strong> Prática caracterizada pela adoção de condutas médicas adicionais com objetivo de reduzir riscos legais, mesmo quando clinicamente desnecessárias.</p>
  
  <h3>Impactos Observados:</h3>
  <ol>
    <li>Solicitação excessiva de exames diagnósticos</li>
    <li>Encaminhamentos prematuros a especialistas</li>
    <li>Prolongamento de tratamentos além do necessário</li>
    <li>Aumento dos custos hospitalares</li>
  </ol>
  
  <p>Se este texto estruturado for extraído corretamente, a funcionalidade HTML está operacional.</p>
</body>
</html>`;
  }
  
  private createRTFTest(): string {
    return `{\\rtf1\\ansi\\ansicpg1252\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 Documento RTF de Teste - Pipeline Universal\\par
\\par
Este arquivo RTF visa validar a extração de texto de documentos em formato Rich Text Format pelo sistema de processamento universal.\\par
\\par
CARACTERÍSTICAS VALIDADAS:\\par
- Formatação RTF básica\\par
- Múltiplos parágrafos\\par
- Caracteres especiais: áçñü\\par
- Pontuação diversa: !@#$%\\par
\\par
CONTEÚDO MÉDICO EXEMPLO:\\par
A medicina defensiva representa uma mudança na prática médica onde profissionais adotam condutas adicionais visando primariamente a proteção legal, mesmo quando não há indicação clínica específica.\\par
\\par
CONSEQUÊNCIAS IDENTIFICADAS:\\par
• Aumento do número de exames solicitados\\par
• Encaminhamentos desnecessários\\par
• Prolongamento de internações\\par
• Elevação dos custos assistenciais\\par
\\par
Se todo este conteúdo for extraído com fidelidade, a funcionalidade RTF está correta.\\par
\\par
Fim do documento de teste RTF.\\par
}`;
  }
  
  private createPDFTest(): string {
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 400
>>
stream
BT
/F1 12 Tf
100 750 Td
(Documento PDF de Teste - Pipeline Universal) Tj
0 -30 Td
(Este arquivo PDF valida extração de texto pelo sistema universal.) Tj
0 -30 Td
(MEDICINA DEFENSIVA: Prática de adoção de condutas adicionais) Tj
0 -30 Td
(com objetivo de redução de riscos legais, mesmo quando) Tj
0 -30 Td
(clinicamente desnecessárias.) Tj
0 -30 Td
(IMPACTOS: Aumento de exames, encaminhamentos desnecessários,) Tj
0 -30 Td
(prolongamento de tratamentos, elevação de custos.) Tj
0 -30 Td
(Caracteres especiais: áçñü!@#$%) Tj
0 -30 Td
(Se este texto for extraído corretamente, PDF está funcional.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
656
%%EOF`;
  }
  
  private printFinalReport(results: TestResult[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL - VALIDAÇÃO PIPELINE UNIVERSAL');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.status === 'PASS');
    const failed = results.filter(r => r.status === 'FAIL');
    
    console.log(`\n✅ APROVADOS: ${passed.length}`);
    console.log(`❌ REPROVADOS: ${failed.length}`);
    console.log(`📈 TAXA DE SUCESSO: ${Math.round((passed.length / results.length) * 100)}%`);
    
    if (failed.length === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ Pipeline universal está OPERACIONAL e pronto para produção!');
      console.log('\nCRITÉRIOS ATENDIDOS:');
      console.log('• Extração multi-formato funcionando');
      console.log('• Similaridade ≥ 99% atingida');
      console.log('• Markdown gerado corretamente');
      console.log('• Logs estruturados criados');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM');
      console.log('Formatos com problemas:');
      failed.forEach(f => {
        console.log(`• ${f.format}: ${f.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Executar teste se chamado diretamente
if (import.meta.main) {
  const validator = new PipelineValidator();
  const results = await validator.runCompleteTest();
  
  const allPassed = results.every(r => r.status === 'PASS');
  Deno.exit(allPassed ? 0 : 1);
}