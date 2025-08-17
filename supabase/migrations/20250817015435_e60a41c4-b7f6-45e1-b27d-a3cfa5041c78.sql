-- FASE 1: Função canônica para buscar plano do usuário (correção dos roles)

-- Criar função segura para buscar plano do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_plan(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  plan text,
  subscribed boolean,
  is_comp boolean,
  plan_level integer,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.user_id,
    s.email,
    COALESCE(s.subscription_tier, 'free') as plan,
    COALESCE(s.subscribed, false) as subscribed,
    COALESCE(s.is_comp, false) as is_comp,
    CASE
      WHEN COALESCE(s.subscription_tier,'free')='pro' THEN 3
      WHEN COALESCE(s.subscription_tier,'free')='starter' THEN 2
      ELSE 1
    END as plan_level,
    s.updated_at
  FROM public.subscribers s
  WHERE s.user_id = COALESCE(target_user_id, auth.uid())
    AND (
      -- User can see their own plan
      s.user_id = auth.uid()
      OR
      -- Admin can see any plan
      EXISTS (
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
      )
    );
$$;