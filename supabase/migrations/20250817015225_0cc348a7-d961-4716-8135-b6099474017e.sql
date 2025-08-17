-- FASE 1: View canônica + RLS policies para unificar leitura do plano

-- Criar view canônica para planos
CREATE OR REPLACE VIEW public.user_plan_v1 AS
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
FROM public.subscribers s;

-- Enable RLS on the view
ALTER VIEW public.user_plan_v1 SET (security_barrier = true);

-- Policy: Usuário logado pode ver seu próprio plano
DROP POLICY IF EXISTS user_read_own_plan ON public.user_plan_v1;
CREATE POLICY user_read_own_plan
  ON public.user_plan_v1
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admin/owner pode ver qualquer plano
DROP POLICY IF EXISTS admin_read_any_plan ON public.user_plan_v1;
CREATE POLICY admin_read_any_plan
  ON public.user_plan_v1
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid() AND r.role IN ('admin','owner')
  ));