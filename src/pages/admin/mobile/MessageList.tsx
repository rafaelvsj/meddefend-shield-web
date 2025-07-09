import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactMessage } from '@/lib/api/messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Stethoscope, Calendar } from 'lucide-react';

interface MessageListProps {
  message: ContactMessage;
}

const MessageList = ({ message }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header da conversa */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{message.name}</CardTitle>
            <Badge variant={message.status === 'unread' ? 'default' : 'secondary'}>
              {message.status === 'unread' ? 'Nova' : 'Lida'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{message.email}</span>
          </div>
          
          {message.whatsapp && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{message.whatsapp}</span>
            </div>
          )}
          
          {message.specialty && (
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span>{message.specialty}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Placeholder para futuras respostas */}
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Funcionalidade de resposta será implementada em breve
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageList;