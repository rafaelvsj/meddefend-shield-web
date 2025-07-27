-- Criar tabelas para funcionalidades reais do dashboard
-- Tabela para análises de texto
CREATE TABLE public.user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  analysis_result JSONB,
  suggestions TEXT[],
  improvements TEXT[],
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para histórico de análises
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.user_analyses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para templates de documentos
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_content JSONB NOT NULL,
  icon TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para user_analyses
CREATE POLICY "Users can view their own analyses" ON public.user_analyses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" ON public.user_analyses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON public.user_analyses
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON public.user_analyses
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para analysis_history
CREATE POLICY "Users can view their own history" ON public.analysis_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own history" ON public.analysis_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para document_templates
CREATE POLICY "Everyone can view public templates" ON public.document_templates
FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON public.document_templates
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.document_templates
FOR UPDATE USING (auth.uid() = created_by);

-- Triggers para updated_at
CREATE TRIGGER update_user_analyses_updated_at
BEFORE UPDATE ON public.user_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates padrão
INSERT INTO public.document_templates (name, description, category, template_content, icon) VALUES
('Receituário Médico', 'Modelo padrão para prescrições médicas', 'Prescrição', '{"sections": ["patient_info", "medications", "instructions", "signature"]}', 'FileCheck'),
('Relatório Médico', 'Estrutura para relatórios médicos completos', 'Relatório', '{"sections": ["patient_info", "examination", "diagnosis", "treatment_plan"]}', 'ClipboardList'),
('Atestado Médico', 'Modelo para atestados médicos', 'Atestado', '{"sections": ["patient_info", "medical_condition", "restrictions", "validity"]}', 'FileCheck');