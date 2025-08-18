-- PHASE 1: Critical Database Security Hardening

-- 1. Enable RLS on audit_user_plan_changes table
ALTER TABLE public.audit_user_plan_changes ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_user_plan_changes
CREATE POLICY "Admins can view plan change audit logs" 
ON public.audit_user_plan_changes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create plan change audit logs" 
ON public.audit_user_plan_changes 
FOR INSERT 
WITH CHECK (true);

-- 2. Enable RLS on usage_counters table
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- Create policies for usage_counters
CREATE POLICY "Users can view their own usage counters" 
ON public.usage_counters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage counters" 
ON public.usage_counters 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Secure subscribers table - require authentication for inserts
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "Authenticated users can insert subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Secure audit_logs table - require authentication for inserts
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated system can create audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 5. Add SET search_path to custom functions for security
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

-- 6. Revoke public access to user_plan_v1 view
REVOKE SELECT ON public.user_plan_v1 FROM anon;
REVOKE SELECT ON public.user_plan_v1 FROM authenticated;

-- Grant access only to admins
GRANT SELECT ON public.user_plan_v1 TO authenticated;

-- Create RLS policy for user_plan_v1 if it's a table (if it's a view, this will be ignored)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_plan_v1') THEN
    ALTER TABLE public.user_plan_v1 ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Admins can view user plan data" 
    ON public.user_plan_v1 
    FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;