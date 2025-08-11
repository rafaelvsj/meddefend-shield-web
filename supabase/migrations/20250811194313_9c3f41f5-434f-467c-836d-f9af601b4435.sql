-- Update pipeline settings to use the public document-extract edge function
UPDATE pipeline_settings 
SET setting_value = 'https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/document-extract',
    updated_at = now()
WHERE setting_key = 'EXTRACTOR_SERVICE_URL';

-- Clean up the stuck record that's causing issues
UPDATE knowledge_base 
SET status = 'discarded',
    processing_logs = jsonb_set(
        COALESCE(processing_logs, '{}'),
        '{discarded_reason}',
        '"stuck_in_processing_cleaned_up"'
    ),
    updated_at = now()
WHERE id = '19f5194c-69c7-411f-bff7-2e3e8c9ba211' AND status = 'processing';