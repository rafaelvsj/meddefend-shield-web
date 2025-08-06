-- Add feature flag for universal pipeline
DO $$
BEGIN
  -- Check if the column already exists to avoid errors
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'llm_settings' 
    AND column_name = 'setting_key'
  ) THEN
    -- If table structure is different, create the settings
    CREATE TABLE IF NOT EXISTS public.system_settings (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Admins can manage system settings" 
    ON public.system_settings 
    FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Insert or update universal pipeline settings
INSERT INTO public.llm_settings (setting_key, setting_value, description, updated_by)
VALUES 
  ('USE_UNIVERSAL_PIPELINE', 'true', 'Enable universal document processing pipeline with multi-format support', auth.uid()),
  ('EXTRACTOR_SERVICE_URL', 'https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/document-extract', 'URL for the universal document extraction service', auth.uid()),
  ('PIPELINE_QUALITY_THRESHOLD', '0.99', 'Minimum similarity score required for document processing approval', auth.uid())
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now(),
  updated_by = auth.uid();