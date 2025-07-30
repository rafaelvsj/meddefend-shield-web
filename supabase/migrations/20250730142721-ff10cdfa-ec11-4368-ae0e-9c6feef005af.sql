-- Update RLS policies for user_roles to allow admin management
-- First ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create comprehensive policies for admins to manage user roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure profiles table also allows admin updates
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create policy for admins to update any profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));