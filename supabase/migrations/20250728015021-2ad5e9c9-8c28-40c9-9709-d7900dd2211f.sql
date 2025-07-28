-- Habilitar extensão pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para chunks de documentos com embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini Text Embedding dimension
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['analysis_completed', 'template_created', etc.]
  active BOOLEAN DEFAULT TRUE,
  secret_key TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered TIMESTAMP WITH TIME ZONE,
  total_triggers INTEGER DEFAULT 0
);

-- Tabela para rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tier_limit INTEGER NOT NULL,
  tier_window INTEGER NOT NULL DEFAULT 3600, -- segundos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- RLS para document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document chunks" 
ON public.document_chunks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS para webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks" 
ON public.webhooks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS para rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_document_chunks_knowledge_base_id ON public.document_chunks(knowledge_base_id);
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_webhooks_events ON public.webhooks USING GIN(events);
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Trigger para auto-processar documentos após upload
CREATE OR REPLACE FUNCTION public.trigger_document_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar edge function process-document automaticamente
  PERFORM net.http_post(
    url := 'https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/process-document',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk"}'::jsonb,
    body := json_build_object('fileId', NEW.id)::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_process_document_trigger
AFTER INSERT ON public.knowledge_base
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.trigger_document_processing();