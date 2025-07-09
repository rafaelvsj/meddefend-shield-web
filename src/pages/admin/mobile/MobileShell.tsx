import { useState, useEffect } from 'react';
import { Bell, Menu, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { messagesApi, ContactMessage } from '@/lib/api/messages';
import MessageList from './MessageList';

const MobileShell = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();

    // Configurar listeners para tempo real
    const newMessageChannel = messagesApi.subscribeToMessages((newMessage) => {
      setMessages(prev => [newMessage, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const updateChannel = messagesApi.subscribeToUpdates((updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
      if (updatedMessage.status === 'read') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      newMessageChannel.unsubscribe();
      updateChannel.unsubscribe();
    };
  }, []);

  const loadMessages = async () => {
    try {
      const data = await messagesApi.list();
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await messagesApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar contagem:', error);
    }
  };

  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDrawerOpen(false);
    
    // Marcar como lida se for nova
    if (message.status === 'unread') {
      messagesApi.markAsRead(message.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background md:hidden">
      {/* Top Bar */}
      <header className="fixed top-0 inset-x-0 h-12 bg-background border-b flex items-center px-4 z-50">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Conversas</h2>
                <p className="text-sm text-muted-foreground">{messages.length} mensagens</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      selectedMessage?.id === message.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{message.name}</p>
                          {message.status === 'unread' && (
                            <Badge variant="default" className="text-xs">Nova</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {message.message.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma mensagem encontrada
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">MD</span>
            </div>
            <span className="font-semibold text-sm">MedDefend Admin</span>
          </div>
        </div>

        <div className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col pt-12 pb-20">
        {selectedMessage ? (
          <MessageList message={selectedMessage} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha uma mensagem da lista para visualizar</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Input Area */}
      <div 
        className="fixed bottom-0 inset-x-0 bg-background border-t p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2">
          <textarea
            placeholder="Digite uma resposta..."
            className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
            disabled
          />
          <Button size="sm" disabled>
            Enviar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Funcionalidade de resposta em desenvolvimento
        </p>
      </div>
    </div>
  );
};

export default MobileShell;