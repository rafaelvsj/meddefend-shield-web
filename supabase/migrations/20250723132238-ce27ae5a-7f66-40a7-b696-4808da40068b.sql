-- Criar hook para adicionar role no JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
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
$$;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;