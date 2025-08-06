import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlayCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';

interface TestResult {
  format: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
  details: {
    fileId?: string;
    similarity?: number;
    extractionMethod?: string;
    error?: string;
    duration?: number;
  };
}

const testFormats = [
  { format: 'TXT', description: 'Plain text files' },
  { format: 'HTML', description: 'Web pages and HTML documents' },
  { format: 'RTF', description: 'Rich Text Format documents' },
  { format: 'PDF', description: 'Portable Document Format' }
];

const ComprehensiveTestRunner = () => {
  const [tests, setTests] = useState<TestResult[]>(
    testFormats.map(tf => ({
      format: tf.format,
      status: 'PENDING',
      details: {}
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const createTestFile = (format: string): { content: string; filename: string; mimeType: string } => {
    const timestamp = Date.now();
    
    switch (format) {
      case 'TXT':
        return {
          content: `Documento TXT de Teste - ${timestamp}

Este é um arquivo de texto simples para validar a extração de conteúdo de arquivos TXT.

Características testadas:
- Texto simples sem formatação
- Múltiplas linhas e parágrafos
- Caracteres especiais: áçñü!@#$%
- Pontuação diversa: .,;:!?()

O sistema deve extrair todo este conteúdo mantendo a fidelidade de 99% ou superior.

Conteúdo técnico de teste:
A medicina defensiva é uma prática onde profissionais adotam condutas adicionais visando reduzir riscos legais, mesmo quando clinicamente desnecessárias.

Fim do documento de teste.`,
          filename: `test-${timestamp}.txt`,
          mimeType: 'text/plain'
        };

      case 'HTML':
        return {
          content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Documento HTML de Teste - ${timestamp}</title>
</head>
<body>
  <h1>Documento HTML de Teste</h1>
  <p>Este é um documento HTML para testar a extração de conteúdo. O sistema deve conseguir extrair todo o texto mantendo a estrutura e fidelidade.</p>
  
  <h2>Características testadas:</h2>
  <ul>
    <li>Headers hierárquicos (H1, H2)</li>
    <li>Parágrafos com formatação</li>
    <li>Listas estruturadas (UL, LI)</li>
    <li>Caracteres especiais: áçñü!@#$%</li>
  </ul>
  
  <h3>Conteúdo médico de exemplo:</h3>
  <p><strong>Medicina Defensiva:</strong> Prática médica caracterizada pela adoção de condutas adicionais com o objetivo de reduzir riscos de processos legais, mesmo quando clinicamente desnecessárias.</p>
  
  <h3>Lista de verificação:</h3>
  <ol>
    <li>Extração de títulos</li>
    <li>Preservação de estrutura</li>
    <li>Remoção de tags HTML</li>
    <li>Manutenção de conteúdo textual</li>
  </ol>
  
  <p><em>Conclusão:</em> Se você conseguir ler este texto estruturado, a extração HTML funcionou corretamente.</p>
</body>
</html>`,
          filename: `test-${timestamp}.html`,
          mimeType: 'text/html'
        };

      case 'RTF':
        return {
          content: `{\\rtf1\\ansi\\ansicpg1252\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 Documento RTF de Teste - ${timestamp}\\par
\\par
Este é um documento RTF para testar a extração de texto. O sistema deve conseguir extrair todo o conteúdo deste arquivo mantendo a fidelidade textual.\\par
\\par
Características testadas:\\par
- Formatação RTF básica\\par
- Múltiplos parágrafos\\par
- Caracteres especiais: áçñü\\par
- Pontuação: !@#$%\\par
\\par
Conteúdo médico de exemplo:\\par
A medicina defensiva é uma prática onde profissionais de saúde adotam condutas adicionais visando reduzir riscos de processos legais, mesmo quando clinicamente desnecessárias.\\par
\\par
Esta prática pode resultar em:\\par
• Solicitação excessiva de exames\\par
• Encaminhamentos desnecessários\\par
• Prolongamento de tratamentos\\par
• Aumento de custos hospitalares\\par
\\par
Fim do documento de teste RTF.\\par
}`,
          filename: `test-${timestamp}.rtf`,
          mimeType: 'application/rtf'
        };

      case 'PDF':
        return {
          content: `%PDF-1.4
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
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(Documento PDF de Teste - ${timestamp}) Tj
0 -20 Td
(Este é um documento PDF simples para testar extração.) Tj
0 -20 Td
(Medicina defensiva: prática de adoção de condutas) Tj
0 -20 Td
(adicionais para reduzir riscos legais.) Tj
0 -20 Td
(Características: áçñü!@#$%) Tj
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
456
%%EOF`,
          filename: `test-${timestamp}.pdf`,
          mimeType: 'application/pdf'
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  const runSingleTest = async (format: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Update status to running
      setTests(prev => prev.map(t => 
        t.format === format ? { ...t, status: 'RUNNING' } : t
      ));

      console.log(`🧪 Starting test for ${format}...`);
      
      // 1. Create test file
      const testFile = createTestFile(format);
      
      // 2. Upload to storage
      const fileName = testFile.filename;
      console.log(`📤 Uploading ${fileName}...`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, new Blob([testFile.content], { type: testFile.mimeType }));

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 3. Create KB entry
      console.log(`📝 Creating knowledge base entry...`);
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: testFile.filename,
          file_type: format.toLowerCase(),
          file_size: testFile.content.length,
          status: 'pending'
        })
        .select()
        .single();

      if (kbError) throw new Error(`KB insert failed: ${kbError.message}`);

      // 4. Process with document-processor-v2
      console.log(`⚙️ Processing with document-processor-v2...`);
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId: kbData.id }
        });

      if (processError) throw new Error(`Processing failed: ${processError.message}`);

      // 5. Check result
      console.log(`✅ Checking processing result...`);
      const { data: resultData, error: resultError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', kbData.id)
        .single();

      if (resultError) throw new Error(`Result fetch failed: ${resultError.message}`);

      const duration = Date.now() - startTime;

      // 6. Validate success criteria
      if (resultData?.status === 'processed' && resultData?.similarity_score >= 0.99) {
        console.log(`✅ ${format} test PASSED! Similarity: ${Math.round(resultData.similarity_score * 100)}%`);
        return {
          format,
          status: 'PASS',
          details: {
            fileId: kbData.id,
            similarity: resultData.similarity_score,
            extractionMethod: resultData.extraction_method,
            duration
          }
        };
      } else {
        console.log(`❌ ${format} test FAILED. Status: ${resultData?.status}, Similarity: ${resultData?.similarity_score}`);
        return {
          format,
          status: 'FAIL',
          details: {
            fileId: kbData.id,
            similarity: resultData?.similarity_score,
            error: `Status: ${resultData?.status}, Similarity: ${Math.round((resultData?.similarity_score || 0) * 100)}%`,
            duration
          }
        };
      }

    } catch (error: any) {
      console.error(`❌ ${format} test failed:`, error);
      return {
        format,
        status: 'FAIL',
        details: {
          error: error.message,
          duration: Date.now() - startTime
        }
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    console.log('🚀 Starting comprehensive pipeline tests...');
    toast.info('Iniciando testes abrangentes do pipeline universal...');

    const results: TestResult[] = [];
    
    for (let i = 0; i < testFormats.length; i++) {
      const format = testFormats[i].format;
      
      try {
        const result = await runSingleTest(format);
        results.push(result);
        
        // Update test results
        setTests(prev => prev.map(t => 
          t.format === format ? result : t
        ));
        
        // Update progress
        setProgress(((i + 1) / testFormats.length) * 100);
        
        if (result.status === 'PASS') {
          toast.success(`✅ ${format} test passou! (${result.details.duration}ms)`);
        } else {
          toast.error(`❌ ${format} test falhou: ${result.details.error}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error testing ${format}:`, error);
        const failResult: TestResult = {
          format,
          status: 'FAIL',
          details: { error: error.message }
        };
        results.push(failResult);
        
        setTests(prev => prev.map(t => 
          t.format === format ? failResult : t
        ));
        
        toast.error(`❌ ${format} test falhou: ${error.message}`);
      }
    }
    
    setIsRunning(false);
    
    // Final summary
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    
    console.log(`📊 RESULTADO FINAL: ${passCount} PASS | ${failCount} FAIL`);
    
    if (failCount === 0) {
      toast.success('🎉 TODOS OS TESTES PASSARAM! Pipeline universal funcionando.');
    } else {
      toast.warning(`⚠️ ${failCount} testes falharam. Verificar implementação.`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <PlayCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'PASS').length,
        failed: tests.filter(t => t.status === 'FAIL').length
      },
      results: tests
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allPassed = tests.every(t => t.status === 'PASS');
  const hasResults = tests.some(t => t.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Testes Abrangentes do Pipeline Universal
            {hasResults && (
              <Button onClick={exportResults} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar Relatório
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executando Testes...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Executar Todos os Testes
                  </>
                )}
              </Button>
            </div>

            {/* Progress */}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso dos testes</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Test Results */}
            <div className="grid gap-4">
              {tests.map((test) => {
                const formatInfo = testFormats.find(tf => tf.format === test.format);
                return (
                  <div key={test.format} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-medium">{test.format}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatInfo?.description}
                          </p>
                          {test.details.duration && (
                            <p className="text-xs text-muted-foreground">
                              {test.details.duration}ms
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {test.details.similarity && (
                          <span className="text-sm font-mono">
                            {Math.round(test.details.similarity * 100)}%
                          </span>
                        )}
                        <Badge variant={
                          test.status === 'PASS' ? 'default' :
                          test.status === 'FAIL' ? 'destructive' :
                          test.status === 'RUNNING' ? 'secondary' : 'outline'
                        }>
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Detailed results */}
                    {test.status === 'PASS' && test.details.extractionMethod && (
                      <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                        <strong>✅ Sucesso:</strong> Método: {test.details.extractionMethod}, 
                        Similaridade: {Math.round(test.details.similarity! * 100)}%
                      </div>
                    )}
                    
                    {test.status === 'FAIL' && test.details.error && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                        <strong>❌ Erro:</strong> {test.details.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Summary */}
            {hasResults && (
              <div className={`p-4 rounded-lg border ${allPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className="font-semibold mb-2">
                  {allPassed ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}
                </h3>
                <p className="text-sm">
                  Passou: {tests.filter(t => t.status === 'PASS').length} | 
                  Falhou: {tests.filter(t => t.status === 'FAIL').length} | 
                  Total: {tests.length}
                </p>
                {allPassed && (
                  <p className="text-sm mt-1 text-green-700 font-medium">
                    ✅ Pipeline universal está operacional e pronto para uso em produção!
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveTestRunner;