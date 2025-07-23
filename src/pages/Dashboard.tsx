import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AnaliseTab } from '@/components/dashboard/tabs/AnaliseTab';
import { ModelosTab } from '@/components/dashboard/tabs/ModelosTab';
import { HistoricoTab } from '@/components/dashboard/tabs/HistoricoTab';
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analise');

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
          {activeTab === 'analise' && <AnaliseTab />}
          {activeTab === 'modelos' && <ModelosTab />}
          {activeTab === 'historico' && <HistoricoTab />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;