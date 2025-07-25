import { useState } from 'react';
import { Send, FileText, Download, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const AnaliseTab = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulação de análise
    setTimeout(() => {
      setAnalysis({
        overallScore: 85,
        suggestions: [
          { type: 'warning', text: 'Considere usar linguagem mais neutra na linha 3' },
          { type: 'info', text: 'Terminologia médica adequada identificada' },
          { type: 'success', text: 'Estrutura profissional mantida' }
        ],
        improvements: [
          { original: 'paciente apresenta', suggested: 'indivíduo apresenta' },
          { original: 'sintomas típicos', suggested: 'sintomas característicos' }
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analise-medica.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white border border-medical-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-medical-slate-800 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Insira aqui sua solicitação ou texto para análise</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Insira aqui sua solicitação ou texto prévio para análise..."
            className="min-h-[200px] bg-medical-slate-50 border-medical-slate-200 focus:border-medical-blue-400 resize-none"
          />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              className="flex-1 sm:flex-none bg-medical-blue-600 hover:bg-medical-blue-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Analisar Texto
                </>
              )}
            </Button>
            
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              disabled={!text.trim()}
              className="flex-1 sm:flex-none border-medical-slate-200 text-medical-slate-600 hover:text-medical-slate-800"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="bg-white border border-medical-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-medical-slate-800 flex items-center justify-between">
              <span>Resultado da Análise</span>
              <Badge variant="secondary" className="bg-medical-blue-100 text-medical-blue-800">
                Pontuação: {analysis.overallScore}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion: any, index: number) => (
                <Alert key={index} className={`border-l-4 ${
                  suggestion.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                  suggestion.type === 'success' ? 'border-green-400 bg-green-50' :
                  'border-blue-400 bg-blue-50'
                }`}>
                  <AlertDescription>{suggestion.text}</AlertDescription>
                </Alert>
              ))}
            </div>

            {analysis.improvements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-medical-slate-800">Sugestões de Melhoria:</h4>
                {analysis.improvements.map((improvement: any, index: number) => (
                  <div key={index} className="p-3 bg-medical-slate-50 rounded-lg">
                    <p className="text-sm text-medical-slate-600">
                      <span className="font-medium">Original:</span> {improvement.original}
                    </p>
                    <p className="text-sm text-medical-slate-600">
                      <span className="font-medium">Sugerido:</span> {improvement.suggested}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={downloadReport}
              variant="outline"
              className="w-full sm:w-auto border-medical-slate-200 text-medical-slate-600 hover:text-medical-slate-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};