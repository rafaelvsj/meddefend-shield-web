import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Search } from "lucide-react";
import { messagesApi, ContactMessage } from "@/lib/api/messages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMessages();
    
    // Configurar listener para novas mensagens
    const channel = messagesApi.subscribeToMessages((newMessage) => {
      setMessages(prev => [newMessage, ...prev]);
    });

    // Configurar listener para atualizações
    const updateChannel = messagesApi.subscribeToUpdates((updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    });

    return () => {
      channel.unsubscribe();
      updateChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, statusFilter, searchQuery]);

  const loadMessages = async () => {
    try {
      const data = await messagesApi.list();
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (statusFilter !== "all") {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query) ||
        (msg.specialty && msg.specialty.toLowerCase().includes(query))
      );
    }

    setFilteredMessages(filtered);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await messagesApi.markAsRead(id);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'unread' ? (
      <Badge variant="default">Nova</Badge>
    ) : (
      <Badge variant="secondary">Lida</Badge>
    );
  };

  const truncateMessage = (message: string, maxLength = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mensagens</h2>
          <p className="text-muted-foreground">
            Gerencie mensagens de contato dos usuários
          </p>
        </div>
        <Badge variant="secondary">
          {messages.filter(msg => msg.status === 'unread').length} não lidas
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou mensagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell>{message.whatsapp || '-'}</TableCell>
                  <TableCell>{message.specialty || '-'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <span className="cursor-pointer text-primary hover:underline">
                          {truncateMessage(message.message)}
                        </span>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Mensagem de {message.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <strong>Email:</strong> {message.email}
                          </div>
                          {message.whatsapp && (
                            <div>
                              <strong>WhatsApp:</strong> {message.whatsapp}
                            </div>
                          )}
                          {message.specialty && (
                            <div>
                              <strong>Especialidade:</strong> {message.specialty}
                            </div>
                          )}
                          <div>
                            <strong>Mensagem:</strong>
                            <p className="mt-2 p-4 bg-muted rounded-lg">{message.message}</p>
                          </div>
                          <div>
                            <strong>Data:</strong> {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(message.status)}</TableCell>
                  <TableCell>
                    {message.status === 'unread' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(message.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMessages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma mensagem encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessages;