-- Fix search_path for vector extension functions that need it
-- Note: Most vector functions are C functions and cannot have search_path set
-- Only fixing functions that can be modified

-- The only vector function that returned from our DDL query
ALTER FUNCTION public.vector_norm(vector) SET search_path = 'public';