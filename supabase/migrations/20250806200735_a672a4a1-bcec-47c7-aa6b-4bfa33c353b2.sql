-- Reset documento específico para teste
UPDATE knowledge_base 
SET status = 'pending', 
    processing_logs = '{}', 
    processed_at = NULL, 
    quality_score = NULL, 
    markdown_content = NULL,
    content = NULL,
    extraction_method = NULL,
    validation_errors = NULL
WHERE id = 'f055de65-c4ba-472e-964f-6ff784b332c3';

-- Limpar chunks relacionados se existirem
DELETE FROM document_chunks 
WHERE knowledge_base_id = 'f055de65-c4ba-472e-964f-6ff784b332c3';