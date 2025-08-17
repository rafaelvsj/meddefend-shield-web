-- FASE 1: View canônica para leitura única (sem RLS na view)
create or replace view public.user_plan_v1 as
select
  s.user_id,
  s.email,
  coalesce(s.subscription_tier, 'free') as plan,
  coalesce(s.subscribed, false)         as subscribed,
  coalesce(s.is_comp, false)            as is_comp,
  case
    when coalesce(s.subscription_tier,'free')='pro' then 3
    when coalesce(s.subscription_tier,'free')='starter' then 2
    else 1
  end as plan_level,
  s.updated_at
from public.subscribers s;

-- FASE 4: Função central para escrita de planos com auditoria e prevenção de sobrescrita
create or replace function public.set_user_plan(
  p_source text,
  p_user_id uuid,
  p_new_plan text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_plan text;
  v_email text;
  v_result jsonb;
begin
  -- Validar source permitido
  if p_source not in ('admin', 'stripe-webhook', 'manual', 'system') then
    return jsonb_build_object('success', false, 'error', 'Invalid source');
  end if;
  
  -- Validar plano
  if p_new_plan not in ('free', 'starter', 'pro') then
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
  
  -- Atualizar/inserir na tabela subscribers
  insert into public.subscribers (user_id, email, subscription_tier, subscribed, updated_at)
  values (p_user_id, v_email, p_new_plan, p_new_plan != 'free', now())
  on conflict (user_id) do update set
    subscription_tier = excluded.subscription_tier,
    subscribed = excluded.subscribed,
    updated_at = excluded.updated_at;
  
  -- Registrar auditoria
  insert into public.audit_logs (user_id, action, resource_type, resource_id, details)
  values (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'PLAN_CHANGE_CENTRALIZED',
    'subscription',
    p_user_id::text,
    jsonb_build_object(
      'old_plan', v_old_plan,
      'new_plan', p_new_plan,
      'source', p_source,
      'changed_by', auth.uid(),
      'timestamp', now()
    )
  );
  
  return jsonb_build_object(
    'success', true,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan,
    'source', p_source
  );
end;
$$;