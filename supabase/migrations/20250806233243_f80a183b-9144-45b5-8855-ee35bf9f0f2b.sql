-- Etapa 1: Expandir tabela knowledge_base com novas colunas para pipeline universal

-- Verificar se as colunas já existem antes de criar
DO $$
BEGIN
    -- Adicionar mime_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='mime_type') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN mime_type TEXT;
    END IF;
    
    -- Adicionar extraction_method se não existir  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='extraction_method') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN extraction_method TEXT;
    END IF;
    
    -- Adicionar ocr_used se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='ocr_used') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN ocr_used BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar similarity_score se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='similarity_score') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN similarity_score NUMERIC;
    END IF;
    
    -- Adicionar markdown_content se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='markdown_content') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN markdown_content TEXT;
    END IF;
END
$$;

-- Expandir processing_logs para incluir logs estruturados da nova pipeline
ALTER TABLE public.knowledge_base ALTER COLUMN processing_logs SET DEFAULT '{}'::jsonb;

-- Criar índices para performance da nova pipeline
CREATE INDEX IF NOT EXISTS idx_knowledge_base_mime_type ON public.knowledge_base(mime_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_extraction_method ON public.knowledge_base(extraction_method);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_similarity_score ON public.knowledge_base(similarity_score);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status_created_at ON public.knowledge_base(status, created_at);

-- Criar tabela para configurações da pipeline universal
CREATE TABLE IF NOT EXISTS public.pipeline_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela pipeline_settings
ALTER TABLE public.pipeline_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para pipeline_settings (apenas admins)
CREATE POLICY "Admins can manage pipeline settings" ON public.pipeline_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir configurações padrão da pipeline universal
INSERT INTO public.pipeline_settings (setting_key, setting_value, description) VALUES
('USE_UNIVERSAL_PIPELINE', 'false', 'Flag para alternar entre pipeline legada e universal'),
('SIMILARITY_THRESHOLD', '0.99', 'Limite mínimo de similaridade para aprovação'),
('EXTRACTOR_SERVICE_URL', '', 'URL do microserviço de extração Python'),
('ENABLE_OCR_FALLBACK', 'true', 'Habilitar fallback para OCR em caso de falha'),
('MAX_CHUNK_SIZE', '1000', 'Tamanho máximo dos chunks de texto'),
('CHUNK_OVERLAP', '200', 'Sobreposição entre chunks')
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pipeline_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pipeline_settings_updated_at
    BEFORE UPDATE ON public.pipeline_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_settings_updated_at();

-- Expandir document_chunks para incluir metadados da nova pipeline
DO $$
BEGIN
    -- Adicionar metadata se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_chunks' AND column_name='metadata') THEN
        ALTER TABLE public.document_chunks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END
$$;