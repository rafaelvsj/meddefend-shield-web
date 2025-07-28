import { useState, useEffect } from 'react';
import { Send, FileText, Download, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useToast } from '@/components/ui/use-toast';

export const AnaliseTab = () => {
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [monthlyAnalyses, setMonthlyAnalyses] = useState(0);

  useEffect(() => {
    loadMonthlyAnalyses();
  }, []);

  const loadMonthlyAnalyses = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { count } = await supabase
        .from('user_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.user?.id)
        .gte('created_at', `${currentMonth}-01`);
      
      setMonthlyAnalyses(count || 0);
    } catch (error) {
      console.error('Error loading monthly analyses:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um texto para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call real AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: {
          text: text.trim(),
          specialty: 'geral', // Can be made configurable later
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Erro na análise');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Set the real analysis results
      const analysisResult = {
        overallScore: data.score,
        suggestions: data.suggestions?.map((text: string, index: number) => ({
          type: index % 3 === 0 ? 'warning' : index % 3 === 1 ? 'info' : 'success',
          text
        })) || [],
        improvements: data.improvements?.map((text: string) => {
          const parts = text.split(' -> ');
          return {
            original: parts[0] || text,
            suggested: parts[1] || 'Ver sugestão detalhada'
          };
        }) || []
      };

      setAnalysis(analysisResult);

      // Update monthly count
      setMonthlyAnalyses(prev => prev + 1);

      toast({
        title: "Análise concluída",
        description: `Sua análise foi processada com sucesso! Score: ${data.score}%`,
      });

      if (data.remainingAnalyses !== undefined) {
        toast({
          title: "Análises restantes",
          description: `Você tem ${data.remainingAnalyses} análises restantes este mês.`,
        });
      }

    } catch (error: any) {
      console.error('Erro na análise:', error);
      
      if (error.message.includes('limit exceeded')) {
        toast({
          title: "Limite atingido",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.message.includes('OPENAI_API_KEY')) {
        toast({
          title: "Configuração necessária",
          description: "A análise de IA não está disponível no momento. Contate o administrador.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro durante a análise. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
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

  // Verificar se usuário pode analisar
  const canAnalyze = () => {
    if (!subscription.subscribed) return false;
    if (subscription.subscription_tier === 'starter' && monthlyAnalyses >= 50) return false;
    return true;
  };

  const renderAnalysisContent = () => (
    <Card className="bg-white border border-medical-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-medical-slate-800 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Insira aqui sua solicitação ou texto para análise</span>
        </CardTitle>
        {subscription.subscription_tier === 'starter' && (
          <p className="text-sm text-gray-600">
            Análises este mês: {monthlyAnalyses}/50
          </p>
        )}
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
            disabled={!text.trim() || isAnalyzing || !canAnalyze()}
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
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!subscription.subscribed ? (
        <SubscriptionGate 
          featureName="Análise de Documentos"
          description="Analise seus documentos médicos com IA para garantir linguagem adequada e profissional."
        >
          {renderAnalysisContent()}
        </SubscriptionGate>
      ) : subscription.subscription_tier === 'starter' && monthlyAnalyses >= 50 ? (
        <SubscriptionGate 
          requiredTier="professional"
          featureName="Análises Ilimitadas"
          description="Você atingiu o limite de 50 análises mensais do plano Starter. Faça upgrade para análises ilimitadas."
        >
          {renderAnalysisContent()}
        </SubscriptionGate>
      ) : (
        renderAnalysisContent()
      )}

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