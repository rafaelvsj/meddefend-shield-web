import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AnaliseTab } from '@/components/dashboard/tabs/AnaliseTab';
import { ModelosTab } from '@/components/dashboard/tabs/ModelosTab';
import { HistoricoTab } from '@/components/dashboard/tabs/HistoricoTab';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Calendar } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analise');
  const { subscription, openCustomerPortal } = useSubscription();

  // Verificação de redirecionamento automático
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Verificar se o usuário é admin e redirecionar se necessário
        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (isAdmin) {
          window.location.href = '/admin';
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
      }
    };
    
    checkAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter flex flex-col lg:flex-row">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader activeTab={activeTab} />
        
        <main className="flex-1 p-4 lg:p-8 bg-medical-slate-50 overflow-y-auto" role="main" aria-labelledby="main-heading">
          {/* Subscription Status Card */}
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {subscription.subscribed 
                      ? `Plano ${subscription.subscription_tier}` 
                      : 'Plano Gratuito'
                    }
                  </p>
                  {subscription.subscription_end && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Renova em: {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {subscription.subscribed && (
                  <Button 
                    variant="outline" 
                    onClick={openCustomerPortal}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Gerenciar Assinatura
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {activeTab === 'analise' && <AnaliseTab />}
          {activeTab === 'modelos' && <ModelosTab />}
          {activeTab === 'historico' && <HistoricoTab />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;