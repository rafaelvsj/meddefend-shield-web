import { Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  activeTab: string;
}

export const DashboardHeader = ({ activeTab }: DashboardHeaderProps) => {
  return (
    <header className="bg-white border-b border-medical-slate-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-medical-slate-800">
            {activeTab === 'analise' && 'Análise de Texto Médico'}
            {activeTab === 'modelos' && 'Biblioteca de Modelos'}
            {activeTab === 'historico' && 'Histórico de Análises'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};