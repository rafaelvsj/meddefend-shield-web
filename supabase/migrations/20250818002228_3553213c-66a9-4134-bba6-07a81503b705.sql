-- FASE 2/3: Tabelas para rate limiting e auditoria

-- Auditoria específica para mudanças de plano (complementa audit_logs)
CREATE TABLE IF NOT EXISTS audit_user_plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('admin', 'stripe-webhook', 'manual', 'system')),
  old_tier text,
  new_tier text NOT NULL,
  reason text,
  admin_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Contadores de uso (rate limiting)
CREATE TABLE IF NOT EXISTS usage_counters (
  user_id uuid NOT NULL,
  period text NOT NULL CHECK (period IN ('daily', 'monthly', 'yearly')),
  counter_key text NOT NULL,
  counter_value integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, period, counter_key)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_user_plan_changes_user_id ON audit_user_plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_plan_changes_created_at ON audit_user_plan_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_counters_window ON usage_counters(window_start);

-- Coluna de versão de sessão para invalidação de cache
ALTER TABLE subscribers 
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- Função para incrementar e verificar limites de uso
CREATE OR REPLACE FUNCTION increment_and_check_usage(
  p_user_id uuid,
  p_period text,
  p_counter_key text,
  p_increment integer DEFAULT 1,
  p_limit integer DEFAULT 1000
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_value integer;
  v_window_start timestamptz;
BEGIN
  -- Calcular janela baseada no período
  CASE p_period
    WHEN 'daily' THEN
      v_window_start := date_trunc('day', now());
    WHEN 'monthly' THEN
      v_window_start := date_trunc('month', now());
    WHEN 'yearly' THEN
      v_window_start := date_trunc('year', now());
    ELSE
      v_window_start := date_trunc('month', now());
  END CASE;

  -- Upsert do contador
  INSERT INTO usage_counters (user_id, period, counter_key, counter_value, window_start, updated_at)
  VALUES (p_user_id, p_period, p_counter_key, p_increment, v_window_start, now())
  ON CONFLICT (user_id, period, counter_key) DO UPDATE SET
    counter_value = CASE 
      WHEN usage_counters.window_start = v_window_start THEN 
        usage_counters.counter_value + p_increment
      ELSE 
        p_increment -- Reset se mudou a janela
    END,
    window_start = v_window_start,
    updated_at = now()
  RETURNING counter_value INTO v_current_value;

  -- Retornar se excedeu o limite
  RETURN v_current_value > p_limit;
END;
$$;

-- Atualizar set_user_plan para incluir auditoria e bump de session_version
CREATE OR REPLACE FUNCTION public.set_user_plan(
  p_source text, 
  p_user_id uuid, 
  p_new_plan text, 
  p_reason text DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_old_plan text;
  v_email text;
  v_result jsonb;
  v_should_update boolean := true;
  v_precedence_blocked boolean := false;
begin
  -- Validar source permitido
  if p_source not in ('admin', 'stripe-webhook', 'manual', 'system') then
    return jsonb_build_object('success', false, 'error', 'Invalid source');
  end if;
  
  -- Validar plano
  if p_new_plan not in ('free', 'starter', 'pro', 'professional', 'ultra') then
    return jsonb_build_object('success', false, 'error', 'Invalid plan');
  end if;
  
  -- Buscar dados atuais
  select subscription_tier, email into v_old_plan, v_email
  from public.subscribers
  where user_id = p_user_id;
  
  -- Se não existir, buscar email do profiles
  if v_email is null then
    select email into v_email
    from public.profiles
    where id = p_user_id;
  end if;
  
  if v_email is null then
    return jsonb_build_object('success', false, 'error', 'User email not found');
  end if;
  
  -- Precedência: admin > stripe-webhook
  -- Se mudança recente (últimos 5 min) do admin e source é stripe-webhook, bloquear
  if p_source = 'stripe-webhook' then
    select exists(
      select 1 from audit_user_plan_changes 
      where user_id = p_user_id 
        and source = 'admin' 
        and created_at > now() - interval '5 minutes'
    ) into v_precedence_blocked;
    
    if v_precedence_blocked then
      v_should_update := false;
    end if;
  end if;
  
  -- Atualizar/inserir na tabela subscribers (apenas se deve atualizar)
  if v_should_update then
    insert into public.subscribers (user_id, email, subscription_tier, subscribed, updated_at, session_version)
    values (p_user_id, v_email, p_new_plan, p_new_plan != 'free', now(), 1)
    on conflict (user_id) do update set
      subscription_tier = excluded.subscription_tier,
      subscribed = excluded.subscribed,
      updated_at = excluded.updated_at,
      session_version = subscribers.session_version + 1;
  end if;
  
  -- Registrar auditoria sempre (mesmo se bloqueado por precedência)
  insert into public.audit_user_plan_changes (
    user_id, source, old_tier, new_tier, reason, admin_id, created_at
  ) values (
    p_user_id, p_source, v_old_plan, p_new_plan, p_reason, p_admin_id, now()
  );
  
  -- Registrar em audit_logs também
  insert into public.audit_logs (user_id, action, resource_type, resource_id, details)
  values (
    coalesce(p_admin_id, auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'PLAN_CHANGE_CENTRALIZED',
    'subscription',
    p_user_id::text,
    jsonb_build_object(
      'old_plan', v_old_plan,
      'new_plan', p_new_plan,
      'source', p_source,
      'reason', p_reason,
      'updated', v_should_update,
      'precedence_blocked', v_precedence_blocked,
      'admin_id', p_admin_id,
      'timestamp', now()
    )
  );
  
  return jsonb_build_object(
    'success', true,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan,
    'source', p_source,
    'updated', v_should_update,
    'precedence_blocked', v_precedence_blocked
  );
end;
$$;