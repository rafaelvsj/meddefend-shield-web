-- coluna para indicar plano "comp"
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS is_comp boolean DEFAULT false;

-- política para admins
CREATE POLICY IF NOT EXISTS "Admins manage comp plans"
  ON public.subscribers FOR ALL
  USING ( public.has_role(auth.uid(),'admin') );