-- Limpar dados corrompidos e resetar para reprocessamento
DELETE FROM document_chunks WHERE knowledge_base_id IN (
  SELECT id FROM knowledge_base WHERE status IN ('processed', 'error')
);

-- Resetar status dos documentos para reprocessamento
UPDATE knowledge_base 
SET 
  status = 'pending',
  processed_at = null,
  quality_score = null,
  markdown_content = null,
  extraction_method = null,
  processing_logs = null,
  validation_errors = null
WHERE status IN ('processed', 'error');

-- Confirmar limpeza
SELECT 
  'Documentos resetados' as action,
  COUNT(*) as count 
FROM knowledge_base 
WHERE status = 'pending';