import { Search, Bell, Settings, User, LogOut, FileText, History, Bookmark, Folder, FolderOpen, FileCheck, ClipboardList, Shield, AlertTriangle, Activity, Stethoscope, Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  const { signOut } = useAuth();

  return (
    <aside className="w-16 lg:w-64 bg-white border-r border-medical-slate-200 flex flex-col">
      <div className="p-4 border-b border-medical-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-medical-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-medical-slate-800">MedDefend</h2>
            <p className="text-sm text-medical-slate-600">Proteção Médica</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-medical-slate-200 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-medical-slate-400" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-medical-slate-50 border-medical-slate-200 focus:border-medical-blue-400"
          />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2" role="tablist">
        <button 
          onClick={() => setActiveTab('analise')} 
          className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'analise' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`}
          aria-label="Análise de Texto"
          role="tab"
          aria-selected={activeTab === 'analise'}
        >
          <FileText className="h-4 lg:h-5 w-4 lg:w-5" />
          <span className="hidden lg:block">Análise</span>
        </button>

        <button onClick={() => setActiveTab('modelos')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'modelos' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Biblioteca de Modelos" role="tab" aria-selected={activeTab === 'modelos'}>
          <Folder className="h-4 lg:h-5 w-4 lg:w-5" />
          <span className="hidden lg:block">Modelos</span>
        </button>

        <button onClick={() => setActiveTab('historico')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'historico' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Histórico" role="tab" aria-selected={activeTab === 'historico'}>
          <History className="h-4 lg:h-5 w-4 lg:w-5" />
          <span className="hidden lg:block">Histórico</span>
        </button>
      </nav>

      <div className="hidden lg:block p-4 border-t border-medical-slate-200">
        <Button 
          onClick={signOut}
          variant="outline" 
          className="w-full flex items-center space-x-2 text-medical-slate-600 hover:text-medical-slate-800 border-medical-slate-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
};