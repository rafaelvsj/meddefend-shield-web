-- Fix Security Definer View Issue
-- The issue is that user_plan_v1 view bypasses RLS and user permissions
-- We need to recreate it properly with appropriate security

-- First drop the existing view
DROP VIEW IF EXISTS public.user_plan_v1;

-- Create a secure version that respects RLS and user permissions
-- Instead of a view, we'll create a security definer function that properly checks permissions
CREATE OR REPLACE FUNCTION public.get_user_plan_secure(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
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
SET search_path TO 'public'
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

-- Create a proper view that uses the secure function for current user only
CREATE VIEW public.user_plan_v1 AS
SELECT * FROM public.get_user_plan_secure();

-- Enable RLS on the view (though it's not strictly necessary since it uses the function)
ALTER VIEW public.user_plan_v1 SET (security_invoker = on);

-- Grant appropriate permissions
GRANT SELECT ON public.user_plan_v1 TO authenticated;
GRANT SELECT ON public.user_plan_v1 TO anon;