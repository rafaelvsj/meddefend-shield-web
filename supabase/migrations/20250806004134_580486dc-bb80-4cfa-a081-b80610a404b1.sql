-- 1. Verificar se a extensão net existe
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Recriar o trigger corretamente
DROP TRIGGER IF EXISTS kb_after_insert ON public.knowledge_base;

CREATE TRIGGER kb_after_insert
  AFTER INSERT ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.trigger_process_document();