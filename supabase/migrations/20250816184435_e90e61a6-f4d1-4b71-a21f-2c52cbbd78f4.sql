-- PHASE 2: Additional security hardening

-- 1. Update handle_new_user function with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF new.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  IF new.email IS NULL OR new.email = '' THEN
    RAISE EXCEPTION 'User email cannot be null or empty';
  END IF;

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

-- 2. Update handle_new_user_role function with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF new.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$function$;

-- 3. Update custom_access_token_hook with proper security
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DECLARE
    claims jsonb;
    user_role text;
    user_uuid uuid;
  BEGIN
    -- Input validation
    IF event IS NULL THEN
      RAISE EXCEPTION 'Event cannot be null';
    END IF;
    
    IF event->>'user_id' IS NULL THEN
      RAISE EXCEPTION 'User ID cannot be null in event';
    END IF;

    -- Validate UUID format
    BEGIN
      user_uuid := (event->>'user_id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid user UUID format';
    END;

    -- Buscar o role do usuário com segurança
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid
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

-- 4. Add security audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log changes to sensitive tables
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    timestamp
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Apply audit trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_knowledge_base ON public.knowledge_base;
CREATE TRIGGER audit_knowledge_base
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();