-- CRITICAL SECURITY FIXES - Phase 1

-- 1. Secure document_templates - restrict medical template access to authenticated users only
DROP POLICY IF EXISTS "Everyone can view public templates" ON public.document_templates;

CREATE POLICY "Authenticated users can view templates"
  ON public.document_templates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_public = true OR 
      auth.uid() = created_by OR
      has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 2. Fix database function security - add proper search_path to existing functions
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

CREATE OR REPLACE FUNCTION public.search_similar_chunks(query_embedding vector, similarity_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 3)
 RETURNS TABLE(content text, source text, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    dc.content,
    kb.original_name as source,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  JOIN knowledge_base kb ON dc.knowledge_base_id = kb.id
  WHERE 1 - (dc.embedding <=> query_embedding) > similarity_threshold
    AND has_role(auth.uid(), 'admin'::app_role) -- Only admins can search knowledge base
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$function$;

-- 3. Strengthen knowledge_base security - ensure only admins can access
CREATE POLICY "Only authenticated admins can read knowledge base for search"
  ON public.knowledge_base
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Secure document_chunks - restrict to admin access only  
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access document chunks"
  ON public.document_chunks
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));