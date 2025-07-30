-- Security Hardening: Fix function search_path warnings
-- Add SET search_path to functions that are missing it

-- Update functions to set search_path for security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
  DECLARE
    claims jsonb;
    user_role text;
  BEGIN
    -- Buscar o role do usuário
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = (event->>'user_id')::uuid
    LIMIT 1;

    -- Adicionar o role ao JWT
    claims := event->'claims';
    
    IF user_role IS NOT NULL THEN
      claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
    ELSE
      claims := jsonb_set(claims, '{role}', '"user"');
    END IF;

    -- Retornar o evento com claims modificadas
    RETURN jsonb_set(event, '{claims}', claims);
  END;
$function$;

-- Configure Auth settings for better security
-- Update OTP expiry to 10 minutes
UPDATE auth.config 
SET otp_exp = 600 
WHERE TRUE;

-- Note: For leaked password protection, this needs to be enabled via Supabase Dashboard
-- as it requires external API configuration for HaveIBeenPwned integration