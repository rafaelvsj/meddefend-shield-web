-- 1. Verificar extensões disponíveis
SELECT * FROM pg_available_extensions WHERE name = 'http';

-- 2. Tentar criar extensão http se disponível
-- CREATE EXTENSION IF NOT EXISTS http;

-- 3. Por enquanto, vou remover a chamada automática via trigger 
-- e usar apenas a chamada manual do frontend que já existe

-- 4. Verificar se knowledge_base está recebendo os registros
SELECT COUNT(*) as total_knowledge_base FROM knowledge_base;