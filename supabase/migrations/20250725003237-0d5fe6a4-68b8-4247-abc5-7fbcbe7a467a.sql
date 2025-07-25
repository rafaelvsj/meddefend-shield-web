BEGIN;

-- 0. Extensão necessária
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

-- 2. Função para checar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT (auth.jwt() ->> 'user_role') = 'admin';
$$;

-- 3. Tabela Knowledge Base
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

-- 4. Tabela LLM Settings
CREATE TABLE IF NOT EXISTS public.llm_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- 5. Registro padrão de instruções master
INSERT INTO public.llm_settings (setting_key, setting_value, description) VALUES
('master_instructions',
 'Você é um assistente especializado em análise médica. Seja preciso, objetivo e sempre baseie suas respostas em evidências científicas. Use linguagem técnica apropriada mas acessível.',
 'Instruções master para como o LLM deve responder globalmente')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. Bucket privado para Knowledge Base
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. Habilitar RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects       ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de acesso (somente admins)
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.knowledge_base;
CREATE POLICY "Admins can manage knowledge base"
  ON public.knowledge_base
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage LLM settings" ON public.llm_settings;
CREATE POLICY "Admins can manage LLM settings"
  ON public.llm_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Políticas de Storage para o bucket
DROP POLICY IF EXISTS "Admins can upload to knowledge base bucket" ON storage.objects;
CREATE POLICY "Admins can upload to knowledge base bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'knowledge-base' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can view knowledge base files" ON storage.objects;
CREATE POLICY "Admins can view knowledge base files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'knowledge-base' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update knowledge base files" ON storage.objects;
CREATE POLICY "Admins can update knowledge base files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'knowledge-base' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete knowledge base files" ON storage.objects;
CREATE POLICY "Admins can delete knowledge base files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'knowledge-base' AND public.is_admin());

-- 10. Gatilhos para updated_at
CREATE OR REPLACE TRIGGER trg_kb_set_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_llm_set_updated_at
BEFORE UPDATE ON public.llm_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;