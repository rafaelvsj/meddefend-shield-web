import { FolderOpen, FileCheck, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ModelosTab = () => {
  const models = [
    {
      id: 1,
      name: 'Receituário Médico',
      description: 'Modelo padrão para prescrições médicas',
      icon: FileCheck,
      category: 'Prescrição'
    },
    {
      id: 2,
      name: 'Relatório Médico',
      description: 'Estrutura para relatórios médicos completos',
      icon: ClipboardList,
      category: 'Relatório'
    },
    {
      id: 3,
      name: 'Atestado Médico',
      description: 'Modelo para atestados médicos',
      icon: FileCheck,
      category: 'Atestado'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white border border-medical-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-medical-slate-800 flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Modelos Disponíveis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <Card key={model.id} className="border border-medical-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-medical-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <model.icon className="h-5 w-5 text-medical-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-medical-slate-800 mb-1">{model.name}</h3>
                      <p className="text-sm text-medical-slate-600 mb-2">{model.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-medical-slate-100 text-medical-slate-600 rounded">
                          {model.category}
                        </span>
                        <Button size="sm" variant="outline" className="text-xs">
                          Usar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};