-- Remover o trigger problemático que usa schema "net" inexistente
DROP TRIGGER IF EXISTS trigger_knowledge_base_processing ON knowledge_base;

-- Remover a função que usa net.http_post 
DROP FUNCTION IF EXISTS trigger_document_processing();
DROP FUNCTION IF EXISTS trigger_process_document();