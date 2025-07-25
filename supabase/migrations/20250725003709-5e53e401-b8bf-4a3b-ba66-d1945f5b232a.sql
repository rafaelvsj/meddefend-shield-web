-- Versão corrigida da infraestrutura Knowledge Base + LLM Settings
-- Remove RLS da tabela storage.objects e cria políticas apenas se não existirem

-- 1. Criar tabelas básicas
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  content      TEXT,
  processed_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.llm_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- 2. Inserir configuração padrão
INSERT INTO public.llm_settings (setting_key, setting_value, description) VALUES
('master_instructions',
 'Você é um assistente especializado em análise médica. Seja preciso, objetivo e sempre baseie suas respostas em evidências científicas. Use linguagem técnica apropriada mas acessível.',
 'Instruções master para como o LLM deve responder globalmente')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Criar bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Habilitar RLS nas tabelas criadas
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_settings   ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para tabelas públicas
CREATE POLICY IF NOT EXISTS "Admins can manage knowledge base"
  ON public.knowledge_base
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can manage LLM settings"
  ON public.llm_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6. Políticas de Storage (sem tentar alterar RLS)
CREATE POLICY IF NOT EXISTS "Admins can upload to knowledge base bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can view knowledge base files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can update knowledge base files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can delete knowledge base files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

-- 7. Triggers para updated_at
CREATE OR REPLACE TRIGGER trg_kb_set_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_llm_set_updated_at
BEFORE UPDATE ON public.llm_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();