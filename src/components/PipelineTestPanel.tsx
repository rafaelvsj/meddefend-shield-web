import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const PipelineTestPanel = () => {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    'process-document-optimized': { status: 'idle' },
    'quality-validator': { status: 'idle' },
  });

  const [documentStatus, setDocumentStatus] = useState<any[]>([]);

  const testProcessDocumentOptimized = async () => {
    console.log('[PipelineTest] 🧪 Testando process-document-optimized...');
    
    setTests(prev => ({ ...prev, 'process-document-optimized': { status: 'testing' } }));
    const startTime = Date.now();

    try {
      // Usar documento específico que falhou
      const testFileId = 'f055de65-c4ba-472e-964f-6ff784b332c3';
      
      console.log(`[PipelineTest] Testando com documento específico: ${testFileId}`);

      // Verificar se documento existe
      const { data: kbDoc, error: fetchError } = await supabase
        .from('knowledge_base')
        .select('id, file_name, status, original_name')
        .eq('id', testFileId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar documento: ${fetchError.message}`);
      }

      console.log(`[PipelineTest] Documento encontrado:`, kbDoc);

      // Chamar a função process-document-optimized
      console.log('[PipelineTest] Invocando function...');
      const { data, error } = await supabase.functions.invoke('process-document-optimized', {
        body: { fileId: testFileId }
      });

      const duration = Date.now() - startTime;

      if (error) {
        console.error(`[PipelineTest] Erro na função:`, error);
        throw new Error(`Function error: ${error.message}`);
      }

      console.log(`[PipelineTest] Resposta da função:`, data);

      setTests(prev => ({
        ...prev,
        'process-document-optimized': {
          status: 'success',
          result: data,
          duration
        }
      }));

      toast.success(`✅ process-document-optimized funcionou! (${duration}ms)`);
      
      // Recarregar status dos documentos
      await loadDocumentStatus();
      
    } catch (error: any) {
      console.error(`[PipelineTest] Erro:`, error);
      const duration = Date.now() - startTime;
      
      setTests(prev => ({
        ...prev,
        'process-document-optimized': {
          status: 'error',
          error: error.message,
          duration
        }
      }));

      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  const testQualityValidator = async () => {
    console.log('[PipelineTest] 🧪 Testando quality-validator...');
    
    setTests(prev => ({ ...prev, 'quality-validator': { status: 'testing' } }));
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('quality-validator', {
        body: { action: 'validate_batch' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      setTests(prev => ({
        ...prev,
        'quality-validator': {
          status: 'success',
          result: data,
          duration
        }
      }));

      toast.success(`✅ quality-validator funcionou! (${duration}ms)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTests(prev => ({
        ...prev,
        'quality-validator': {
          status: 'error',
          error: error.message,
          duration
        }
      }));

      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  const loadDocumentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, file_name, status, quality_score, markdown_content, processed_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setDocumentStatus(data || []);
    } catch (error) {
      console.error('Erro ao carregar status dos documentos:', error);
    }
  };

  React.useEffect(() => {
    loadDocumentStatus();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Pipeline de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Button onClick={testProcessDocumentOptimized} variant="default">
                🚀 Testar process-document-optimized
              </Button>
              <Button onClick={testQualityValidator} variant="outline">
                🔍 Testar quality-validator
              </Button>
              <Button onClick={loadDocumentStatus} variant="outline">
                🔄 Atualizar Status
              </Button>
            </div>

            {/* Resultados dos testes */}
            {Object.entries(tests).map(([functionName, result]) => (
              <div key={functionName} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium">{functionName}</h3>
                    {result.duration && (
                      <p className="text-sm text-muted-foreground">{result.duration}ms</p>
                    )}
                  </div>
                </div>
                
                <Badge variant={
                  result.status === 'success' ? 'default' :
                  result.status === 'error' ? 'destructive' :
                  result.status === 'testing' ? 'secondary' : 'outline'
                }>
                  {result.status}
                </Badge>
              </div>
            ))}
            
            {/* Exibir resultados detalhados */}
            {Object.entries(tests).map(([functionName, result]) => (
              result.result && (
                <div key={`${functionName}-result`} className="mt-2 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">✅ Resultado de {functionName}:</h4>
                  <pre className="text-xs overflow-auto max-h-32 bg-background p-2 rounded border">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )
            ))}
            
            {Object.entries(tests).map(([functionName, result]) => (
              result.error && (
                <div key={`${functionName}-error`} className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium mb-2 text-destructive">❌ Erro em {functionName}:</h4>
                  <pre className="text-xs overflow-auto max-h-32 text-destructive">
                    {result.error}
                  </pre>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status dos documentos */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Status dos Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documentStatus.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {doc.quality_score || 'N/A'} | 
                    Markdown: {doc.markdown_content ? '✅' : '❌'} |
                    Processado: {doc.processed_at ? new Date(doc.processed_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <Badge variant={
                  doc.status === 'processed' ? 'default' :
                  doc.status === 'error' ? 'destructive' :
                  doc.status === 'processing' ? 'secondary' : 'outline'
                }>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineTestPanel;