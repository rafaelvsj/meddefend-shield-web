import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  format: string;
  status: 'PASS' | 'FAIL';
  details: {
    fileId?: string;
    similarity?: number;
    extractionMethod?: string;
    error?: string;
    duration?: number;
  };
}

class ComprehensiveDocumentTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Iniciando testes abrangentes do pipeline universal...');
    
    const testFiles = [
      { format: 'PDF', content: this.createTestPDF(), filename: 'test.pdf' },
      { format: 'HTML', content: this.createTestHTML(), filename: 'test.html' },
      { format: 'TXT', content: this.createTestTXT(), filename: 'test.txt' },
      { format: 'RTF', content: this.createTestRTF(), filename: 'test.rtf' }
    ];

    for (const testFile of testFiles) {
      try {
        console.log(`📝 Testando formato ${testFile.format}...`);
        const result = await this.testFormat(testFile);
        this.results.push(result);
      } catch (error) {
        console.error(`❌ Erro ao testar ${testFile.format}:`, error);
        this.results.push({
          format: testFile.format,
          status: 'FAIL',
          details: { error: error.message }
        });
      }
    }

    this.printResults();
    return this.results;
  }

  private async testFormat(testFile: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // 1. Upload do arquivo para storage
      const fileName = `test-${Date.now()}-${testFile.filename}`;
      
      console.log(`📤 Fazendo upload de ${fileName}...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testFile.content], { type: 'text/plain' }));

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 2. Criar entrada na knowledge_base
      console.log(`📝 Criando entrada na knowledge_base...`);
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: testFile.filename,
          file_type: testFile.format.toLowerCase(),
          file_size: testFile.content.length,
          status: 'pending'
        })
        .select()
        .single();

      if (kbError) throw new Error(`KB insert failed: ${kbError.message}`);

      // 3. Processar com document-processor-v2
      console.log(`⚙️ Processando com document-processor-v2...`);
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId: kbData.id }
        });

      if (processError) throw new Error(`Processing failed: ${processError.message}`);

      // 4. Verificar resultado
      const { data: resultData } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', kbData.id)
        .single();

      const duration = Date.now() - startTime;

      if (resultData?.status === 'processed' && resultData?.similarity_score >= 0.99) {
        return {
          format: testFile.format,
          status: 'PASS',
          details: {
            fileId: kbData.id,
            similarity: resultData.similarity_score,
            extractionMethod: resultData.extraction_method,
            duration
          }
        };
      } else {
        return {
          format: testFile.format,
          status: 'FAIL',
          details: {
            fileId: kbData.id,
            similarity: resultData?.similarity_score,
            error: `Status: ${resultData?.status}, Similarity: ${resultData?.similarity_score}`,
            duration
          }
        };
      }

    } catch (error) {
      return {
        format: testFile.format,
        status: 'FAIL',
        details: {
          error: error.message,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private createTestPDF(): string {
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
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Documento PDF de Teste) Tj
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
299
%%EOF`;
  }

  private createTestHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Documento HTML de Teste</title>
</head>
<body>
  <h1>Documento HTML de Teste</h1>
  <p>Este é um documento HTML para testar a extração de conteúdo. O sistema deve conseguir extrair todo o texto mantendo a estrutura e fidelidade.</p>
  <h2>Características testadas:</h2>
  <ul>
    <li>Headers hierárquicos</li>
    <li>Parágrafos com formatação</li>
    <li>Listas estruturadas</li>
    <li>Caracteres especiais: áçñü!@#$%</li>
  </ul>
  <p><strong>Conclusão:</strong> Se você conseguir ler este texto, a extração HTML funcionou corretamente.</p>
</body>
</html>`;
  }

  private createTestTXT(): string {
    return `Documento TXT de Teste

Este é um arquivo de texto simples para validar a extração de conteúdo de arquivos TXT.

Características testadas:
- Texto simples sem formatação
- Múltiplas linhas
- Quebras de parágrafo
- Caracteres especiais: áçñü!@#$%
- Pontuação diversa: .,;:!?

O sistema deve extrair todo este conteúdo mantendo a fidelidade de 99% ou superior.

Fim do documento de teste.`;
  }

  private createTestRTF(): string {
    return `{\\rtf1\\ansi\\ansicpg1252\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 Documento RTF de Teste\\par
\\par
Este é um documento RTF para testar a extração de texto. O sistema deve conseguir extrair todo o conteúdo deste arquivo mantendo a fidelidade textual.\\par
\\par
Características testadas:\\par
- Formatação RTF básica\\par
- Múltiplos parágrafos\\par
- Caracteres especiais: áçñü\\par
- Pontuação: !@#$%\\par
\\par
Fim do documento de teste.\\par
}`;
  }

  private printResults(): void {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES:\n');
    console.log('='.repeat(50));
    
    let passCount = 0;
    let failCount = 0;

    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const similarity = result.details.similarity ? 
        ` (${Math.round(result.details.similarity * 100)}%)` : '';
      const duration = result.details.duration ? 
        ` [${result.details.duration}ms]` : '';
      
      console.log(`${status} ${result.format}${similarity}${duration}`);
      
      if (result.details.error) {
        console.log(`   Error: ${result.details.error}`);
      }
      
      if (result.status === 'PASS') passCount++;
      else failCount++;
    });

    console.log('='.repeat(50));
    console.log(`📈 RESUMO: ${passCount} PASS | ${failCount} FAIL`);
    
    if (failCount === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Pipeline universal funcionando.');
    } else {
      console.log('⚠️ Alguns testes falharam. Revisar implementação.');
    }
  }
}

// Função exportada para uso
export async function runComprehensiveTests(): Promise<TestResult[]> {
  const tester = new ComprehensiveDocumentTest();
  return await tester.runAllTests();
}

// Auto-executar se chamado diretamente
if (import.meta.main) {
  runComprehensiveTests().then(results => {
    const allPassed = results.every(r => r.status === 'PASS');
    Deno.exit(allPassed ? 0 : 1);
  });
}