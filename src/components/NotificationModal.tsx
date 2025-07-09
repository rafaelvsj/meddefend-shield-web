import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, Settings, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nova análise concluída',
    message: 'Seu texto médico foi analisado com sucesso. Resultado disponível para visualização.',
    time: 'há 5 minutos',
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Modelo atualizado',
    message: 'O modelo de cardiologia foi atualizado para a versão 2.1 com melhorias de precisão.',
    time: 'há 2 horas',
    read: false,
    type: 'info'
  },
  {
    id: '3',
    title: 'Sistema em manutenção',
    message: 'Manutenção programada para amanhã às 2h. Serviços podem ficar indisponíveis por 30 minutos.',
    time: 'há 1 dia',
    read: false,
    type: 'warning'
  },
  {
    id: '4',
    title: 'Análise finalizada',
    message: 'Relatório de análise neurológica pronto para download.',
    time: 'há 2 dias',
    read: true,
    type: 'success'
  },
  {
    id: '5',
    title: 'Limite mensal atingido',
    message: 'Você utilizou 90% do seu limite mensal de análises. Considere fazer upgrade do plano.',
    time: 'há 3 dias',
    read: true,
    type: 'warning'
  },
  {
    id: '6',
    title: 'Novo recurso disponível',
    message: 'Agora você pode exportar análises em formato PDF diretamente do dashboard.',
    time: 'há 1 semana',
    read: true,
    type: 'info'
  }
];

export const NotificationModal = ({ open, onOpenChange }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              {filter === 'all' ? 'Não lidas' : 'Todas'}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    !notification.read 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getTypeColor(notification.type)}`}
                        >
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações de notificação
          </Button>
          
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};