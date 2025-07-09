import { useState } from 'react';
import { Bell, Settings, User, LogOut, UserCog, Shield, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationModal } from '@/components/NotificationModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface DashboardHeaderProps {
  activeTab: string;
}

export const DashboardHeader = ({ activeTab }: DashboardHeaderProps) => {
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    }
  };
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

        <div className="flex items-center space-x-2">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800 relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-4 space-y-1">
                <div className="font-medium">Nova análise concluída</div>
                <div className="text-sm text-muted-foreground">Seu texto médico foi analisado com sucesso</div>
                <div className="text-xs text-muted-foreground">há 5 minutos</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-4 space-y-1">
                <div className="font-medium">Modelo atualizado</div>
                <div className="text-sm text-muted-foreground">O modelo de cardiologia foi atualizado</div>
                <div className="text-xs text-muted-foreground">há 2 horas</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-4 space-y-1">
                <div className="font-medium">Sistema em manutenção</div>
                <div className="text-sm text-muted-foreground">Manutenção programada para amanhã às 2h</div>
                <div className="text-xs text-muted-foreground">há 1 dia</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center cursor-pointer"
                onClick={() => setNotificationModalOpen(true)}
              >
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Configurações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Configurações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                <UserCog className="mr-2 h-4 w-4" />
                Preferências da conta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/security-settings')}>
                <Shield className="mr-2 h-4 w-4" />
                Segurança e privacidade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/notification-settings')}>
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/help-support')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Ajuda e suporte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Perfil do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-medical-slate-600 hover:text-medical-slate-800">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/user-profile')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <NotificationModal 
        open={notificationModalOpen} 
        onOpenChange={setNotificationModalOpen}
      />
    </header>
  );
};