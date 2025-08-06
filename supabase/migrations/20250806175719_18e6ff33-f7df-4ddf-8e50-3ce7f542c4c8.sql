-- FASE 1: Parada emergencial e limpeza

-- Resetar documentos travados há mais de 1 hora
UPDATE knowledge_base 
SET status = 'error', 
    processed_at = now(),
    content = 'Documento resetado devido a processamento travado'
WHERE status = 'processing' 
AND updated_at < now() - interval '1 hour';

-- Deletar todos os chunks corrompidos que contêm código PDF
DELETE FROM document_chunks 
WHERE content ILIKE '%PDF-%' 
   OR content ILIKE '%stream%' 
   OR content ILIKE '%endobj%'
   OR content ILIKE '%obj%'
   OR LENGTH(content) < 100;

-- Resetar status de documentos que tinham chunks corrompidos
UPDATE knowledge_base 
SET status = 'pending',
    processed_at = NULL,
    content = NULL
WHERE id IN (
  SELECT DISTINCT kb.id 
  FROM knowledge_base kb 
  LEFT JOIN document_chunks dc ON kb.id = dc.knowledge_base_id 
  WHERE dc.id IS NULL AND kb.status = 'processed'
);

-- Adicionar campos para controle de qualidade na tabela knowledge_base
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extraction_method TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS validation_errors TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processing_logs JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS markdown_content TEXT DEFAULT NULL;