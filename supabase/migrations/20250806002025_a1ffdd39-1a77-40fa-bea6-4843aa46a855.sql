-- Corrigir política de inserção na tabela knowledge_base
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON knowledge_base;

CREATE POLICY "Admins can view knowledge base" 
ON knowledge_base 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert knowledge base" 
ON knowledge_base 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update knowledge base" 
ON knowledge_base 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete knowledge base" 
ON knowledge_base 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));