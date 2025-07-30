-- Fix trigger_document_processing function search_path
CREATE OR REPLACE FUNCTION public.trigger_document_processing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Chamar edge function process-document automaticamente
  PERFORM net.http_post(
    url := 'https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/process-document',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk"}'::jsonb,
    body := json_build_object('fileId', NEW.id)::jsonb
  );
  
  RETURN NEW;
END;
$function$;