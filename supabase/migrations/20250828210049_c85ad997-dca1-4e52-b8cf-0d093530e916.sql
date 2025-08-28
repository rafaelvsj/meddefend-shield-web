-- Fix RLS Security Issue for user_plan_v1 View
-- The view currently has no RLS policies which means any authenticated user can access other users' data

-- Drop the current view to recreate it properly
DROP VIEW IF EXISTS public.user_plan_v1;

-- Create a proper table instead of a view for better RLS control
-- This will replace the view with a secure table that respects user boundaries
CREATE TABLE public.user_plan_v1 (
    user_id uuid,
    email text,
    plan text,
    subscribed boolean,
    is_comp boolean,
    plan_level integer,
    updated_at timestamp with time zone
);

-- Enable RLS on the table
ALTER TABLE public.user_plan_v1 ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies
CREATE POLICY "Users can view their own plan data" 
ON public.user_plan_v1 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all plan data" 
ON public.user_plan_v1 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert plan data" 
ON public.user_plan_v1 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update plan data" 
ON public.user_plan_v1 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete plan data" 
ON public.user_plan_v1 
FOR DELETE 
USING (true);

-- Create a secure function to populate/refresh the table data
CREATE OR REPLACE FUNCTION public.refresh_user_plan_v1()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clear existing data
  DELETE FROM public.user_plan_v1;
  
  -- Insert current data from subscribers with proper formatting
  INSERT INTO public.user_plan_v1 (user_id, email, plan, subscribed, is_comp, plan_level, updated_at)
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
END;
$$;

-- Initially populate the table
SELECT public.refresh_user_plan_v1();

-- Grant appropriate permissions
GRANT SELECT ON public.user_plan_v1 TO authenticated;
GRANT SELECT ON public.user_plan_v1 TO anon;

-- Create a trigger to keep the table updated when subscribers change
CREATE OR REPLACE FUNCTION public.sync_user_plan_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_plan_v1 (user_id, email, plan, subscribed, is_comp, plan_level, updated_at)
    VALUES (
      NEW.user_id,
      NEW.email,
      COALESCE(NEW.subscription_tier, 'free'),
      COALESCE(NEW.subscribed, false),
      COALESCE(NEW.is_comp, false),
      CASE
        WHEN COALESCE(NEW.subscription_tier,'free')='pro' THEN 3
        WHEN COALESCE(NEW.subscription_tier,'free')='starter' THEN 2
        ELSE 1
      END,
      NEW.updated_at
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.user_plan_v1 SET
      email = NEW.email,
      plan = COALESCE(NEW.subscription_tier, 'free'),
      subscribed = COALESCE(NEW.subscribed, false),
      is_comp = COALESCE(NEW.is_comp, false),
      plan_level = CASE
        WHEN COALESCE(NEW.subscription_tier,'free')='pro' THEN 3
        WHEN COALESCE(NEW.subscription_tier,'free')='starter' THEN 2
        ELSE 1
      END,
      updated_at = NEW.updated_at
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_plan_v1 WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_user_plan_v1_trigger ON public.subscribers;
CREATE TRIGGER sync_user_plan_v1_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_plan_v1();