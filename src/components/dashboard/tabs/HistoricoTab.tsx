import { History, FileText, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const HistoricoTab = () => {
  const historyItems = [
    {
      id: 1,
      title: 'Análise de Receituário - Paciente XYZ',
      date: '15/03/2024',
      score: 92,
      status: 'Concluído'
    },
    {
      id: 2,
      title: 'Relatório Médico - Consulta ABC',
      date: '14/03/2024',
      score: 88,
      status: 'Concluído'
    },
    {
      id: 3,
      title: 'Atestado Médico - Funcionário DEF',
      date: '13/03/2024',
      score: 95,
      status: 'Concluído'
    }
  ];

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
        </CardContent>
      </Card>
    </div>
  );
};