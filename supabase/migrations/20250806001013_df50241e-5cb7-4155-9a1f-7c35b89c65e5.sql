-- Criar políticas de storage para knowledge-base bucket
CREATE POLICY "Admins can upload to knowledge-base" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view knowledge-base files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from knowledge-base" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'knowledge-base' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage knowledge-base files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'knowledge-base');