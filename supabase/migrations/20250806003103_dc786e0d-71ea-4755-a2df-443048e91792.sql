-- 1. Criar trigger automático para process-document
CREATE OR REPLACE FUNCTION public.trigger_process_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/process-document',
    body := json_build_object('fileId', NEW.id)::text,
    headers := json_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzODIwNCwiZXhwIjoyMDY2ODE0MjA0fQ.c0X3DcALuP-mPtq47b8RBiW-aw6PTUeWJcv2L_Q6CYM',
      'Content-Type', 'application/json'
    )
  );
  RETURN NEW;
END;
$$;

-- 2. Criar trigger na tabela knowledge_base
DROP TRIGGER IF EXISTS kb_after_insert ON public.knowledge_base;

CREATE TRIGGER kb_after_insert
  AFTER INSERT ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.trigger_process_document();

-- 3. Adicionar user_id em user_analyses se não existir
ALTER TABLE public.user_analyses 
ADD COLUMN IF NOT EXISTS user_id_ref uuid REFERENCES auth.users(id);