-- Remover o trigger e função problemáticos que usam schema "net" inexistente
DROP TRIGGER IF EXISTS auto_process_document_trigger ON knowledge_base CASCADE;
DROP FUNCTION IF EXISTS trigger_document_processing() CASCADE;
DROP FUNCTION IF EXISTS trigger_process_document() CASCADE;