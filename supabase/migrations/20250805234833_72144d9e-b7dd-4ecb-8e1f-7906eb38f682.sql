-- Fix data relationships and add foreign key constraint for subscribers
-- Add foreign key relationship between subscribers and profiles
ALTER TABLE public.subscribers 
ADD CONSTRAINT fk_subscribers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update existing subscribers to have proper user_id mapping
-- First, update subscribers that have email but no user_id
UPDATE public.subscribers 
SET user_id = profiles.id
FROM public.profiles 
WHERE subscribers.email = profiles.email 
AND subscribers.user_id IS NULL;

-- Ensure all existing users have default subscription data
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
SELECT 
  p.id,
  p.email,
  false,
  'free'
FROM public.profiles p
LEFT JOIN public.subscribers s ON s.user_id = p.id
WHERE s.id IS NULL AND p.email IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);