import { useState, useEffect } from 'react';
import { History, FileText, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const HistoricoTab = () => {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('user_analyses')
        .select('*')
        .eq('user_id', userData.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory = data?.map(item => ({
        id: item.id,
        title: item.title,
        date: new Date(item.created_at).toLocaleDateString('pt-BR'),
        score: item.score,
        status: item.status === 'completed' ? 'Concluído' : 'Processando'
      })) || [];

      setHistoryItems(formattedHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Fallback para dados estáticos
      setHistoryItems([
        {
          id: 1,
          title: 'Análise de Receituário - Paciente XYZ',
          date: '15/03/2024',
          score: 92,
          status: 'Concluído'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white border border-medical-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-medical-slate-800 flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Histórico de Análises</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando histórico...</div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-8 text-medical-slate-500">
              Nenhuma análise encontrada. Faça sua primeira análise na aba "Análise".
            </div>
          ) : (
            <div className="space-y-4">
              {historyItems.map((item) => (
              <div key={item.id} className="p-4 border border-medical-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-medical-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-medical-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-medical-slate-800">{item.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-medical-slate-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.date}</span>
                        </span>
                        <span>Pontuação: {item.score}%</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-medical-slate-200 text-medical-slate-600 hover:text-medical-slate-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};