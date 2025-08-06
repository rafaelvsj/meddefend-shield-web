-- Adicionar colunas para suporte multi-formato
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS ocr_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS similarity_score NUMERIC;

-- Criar tabela de logs detalhados para o pipeline
CREATE TABLE IF NOT EXISTS kb_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  score NUMERIC,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE kb_processing_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage processing logs
CREATE POLICY "Admins can manage processing logs" 
ON kb_processing_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));