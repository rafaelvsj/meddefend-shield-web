import { useState, useEffect } from 'react';
import { FolderOpen, FileCheck, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionGate } from '@/components/SubscriptionGate';

export const ModelosTab = () => {
  const { subscription } = useSubscription();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Filtrar templates baseado no plano
      let query = supabase.from('document_templates').select('*');
      
      if (!subscription.subscribed) {
        query = query.eq('is_public', true).limit(2); // Apenas 2 templates básicos
      } else if (subscription.subscription_tier === 'starter') {
        query = query.limit(5); // Máximo 5 templates
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      // Fallback para dados estáticos
      setTemplates([
        {
          id: 1,
          name: 'Receituário Médico',
          description: 'Modelo padrão para prescrições médicas',
          icon: 'FileCheck',
          category: 'Prescrição'
        },
        {
          id: 2,
          name: 'Relatório Médico',
          description: 'Estrutura para relatórios médicos completos',
          icon: 'ClipboardList',
          category: 'Relatório'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'ClipboardList':
        return ClipboardList;
      default:
        return FileCheck;
    }
  };

  const renderTemplatesContent = () => (
    <Card className="bg-white border border-medical-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-medical-slate-800 flex items-center space-x-2">
          <FolderOpen className="h-5 w-5" />
          <span>Modelos Disponíveis</span>
          {subscription.subscription_tier === 'starter' && (
            <span className="text-sm text-gray-500 ml-2">(Máximo 5 modelos)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const IconComponent = getIconComponent(template.icon);
              return (
                <Card key={template.id} className="border border-medical-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-medical-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-medical-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-medical-slate-800 mb-1">{template.name}</h3>
                        <p className="text-sm text-medical-slate-600 mb-2">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-1 bg-medical-slate-100 text-medical-slate-600 rounded">
                            {template.category}
                          </span>
                          <Button size="sm" variant="outline" className="text-xs">
                            Usar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {!subscription.subscribed ? (
        <SubscriptionGate 
          featureName="Modelos de Documentos"
          description="Acesse modelos profissionais para documentação médica padronizada."
        >
          {renderTemplatesContent()}
        </SubscriptionGate>
      ) : (
        renderTemplatesContent()
      )}
    </div>
  );
};