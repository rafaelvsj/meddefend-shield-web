-- Limpar dados órfãos e inconsistentes
DELETE FROM document_chunks WHERE knowledge_base_id NOT IN (SELECT id FROM knowledge_base WHERE status = 'processed');

-- Limpar logs de processamento de documentos descartados
DELETE FROM kb_processing_logs WHERE file_id NOT IN (SELECT id FROM knowledge_base WHERE status != 'discarded');

-- Adicionar configuração de tamanho de chunk se não existir
INSERT INTO pipeline_settings (setting_key, setting_value, description)
VALUES ('CHUNK_SIZE', '1000', 'Size of text chunks for embeddings')
ON CONFLICT (setting_key) DO NOTHING;