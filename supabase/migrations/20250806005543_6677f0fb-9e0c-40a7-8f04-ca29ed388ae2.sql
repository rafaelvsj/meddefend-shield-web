-- Corrigir o relacionamento FK entre user_analyses e auth.users
-- Primeiro, verificar se há algum user_id inválido
UPDATE user_analyses 
SET user_id = user_id_ref 
WHERE user_id_ref IS NOT NULL AND user_id IS NULL;

-- Adicionar FK constraint para user_id (que referencia auth.users)
ALTER TABLE user_analyses 
ADD CONSTRAINT user_analyses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remover a coluna redundante user_id_ref que criamos por engano
ALTER TABLE user_analyses DROP COLUMN IF EXISTS user_id_ref;