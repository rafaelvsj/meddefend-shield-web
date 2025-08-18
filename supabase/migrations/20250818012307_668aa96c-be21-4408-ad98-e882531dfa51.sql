-- Create a resilient admin_update_user_plan RPC to replace Edge calls
-- Validates admin via has_role(), calls central set_user_plan(), returns before/after and session_version

CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  p_user_id uuid,
  p_new_plan text,
  p_reason text DEFAULT 'admin panel'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_before_plan text;
  v_before_session int;
  v_after_plan text;
  v_after_session int;
  v_result jsonb;
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '28000';
  END IF;

  -- Only admins can change plans
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF p_new_plan NOT IN ('free','starter','pro') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  -- Snapshot BEFORE
  SELECT s.subscription_tier, s.session_version
    INTO v_before_plan, v_before_session
  FROM public.subscribers s
  WHERE s.user_id = p_user_id;

  -- Perform update via central function (prefer 5-arg variant; fallback to 3-arg)
  BEGIN
    SELECT public.set_user_plan('admin', p_user_id, p_new_plan, p_reason, auth.uid()) INTO v_result;
  EXCEPTION WHEN undefined_function THEN
    SELECT public.set_user_plan('admin', p_user_id, p_new_plan) INTO v_result;
  END;

  IF COALESCE((v_result->>'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'set_user_plan failed: %', v_result->>'error';
  END IF;

  -- Snapshot AFTER
  SELECT s.subscription_tier, s.session_version
    INTO v_after_plan, v_after_session
  FROM public.subscribers s
  WHERE s.user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'before', jsonb_build_object('plan', COALESCE(v_before_plan,'free'), 'session_version', COALESCE(v_before_session,0)),
    'after',  jsonb_build_object('plan', v_after_plan, 'session_version', v_after_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, text, text) TO authenticated;