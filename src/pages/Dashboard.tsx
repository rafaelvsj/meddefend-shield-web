import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AnaliseTab } from '@/components/dashboard/tabs/AnaliseTab';
import { ModelosTab } from '@/components/dashboard/tabs/ModelosTab';
import { HistoricoTab } from '@/components/dashboard/tabs/HistoricoTab';
import { usePlan } from '@/hooks/usePlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Calendar } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analise');
  const { plan, subscribed, forceRefreshPlan } = usePlan();
  
  // Função para abrir portal do Stripe via supabase
  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
    }
  };
  const navigate = useNavigate();

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

    // Verificar parâmetros de sucesso de pagamento
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      // Recarregar status da assinatura após pagamento bem-sucedido
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, []);

  // Auto-fetch global agora está no hook usePlan

  return (
    <div className="min-h-screen bg-white font-inter flex flex-col lg:flex-row">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader activeTab={activeTab} />
        
        <main className="flex-1 p-4 lg:p-8 bg-medical-slate-50 overflow-y-auto" role="main" aria-labelledby="main-heading">
          {/* Subscription Status Card */}
          {subscribed ? (
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        Plano {plan.charAt(0).toUpperCase() + plan.slice(1)} {subscribed ? 'Ativo' : 'Gratuito'}
                      </p>
                      <p className="text-sm text-green-600">
                        Acesso completo a todos os recursos
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={openCustomerPortal}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        Conta Gratuita
                      </p>
                      <p className="text-sm text-yellow-600">
                        Faça upgrade para acessar todos os recursos
                      </p>
                    </div>
                  </div>
                   <Button
                     onClick={() => navigate('/checkout')}
                     className="bg-green-600 hover:bg-green-700 text-white"
                     size="sm"
                   >
                    <Crown className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'analise' && <AnaliseTab />}
          {activeTab === 'modelos' && <ModelosTab />}
          {activeTab === 'historico' && <HistoricoTab />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;