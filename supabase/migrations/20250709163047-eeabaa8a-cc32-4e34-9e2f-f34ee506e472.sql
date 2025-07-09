-- Criar tabela para mensagens de contato
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  specialty TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem acessar as mensagens
CREATE POLICY "Admins can view all messages" 
ON public.contact_messages 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages" 
ON public.contact_messages 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ativar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;