-- Resetar status dos arquivos com erro para permitir reprocessamento
UPDATE knowledge_base 
SET status = 'pending' 
WHERE status = 'error';