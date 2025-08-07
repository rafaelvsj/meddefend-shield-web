-- Clean up corrupted documents
UPDATE knowledge_base 
SET status = 'discarded',
    processing_logs = jsonb_set(
      COALESCE(processing_logs, '{}'), 
      '{discarded_reason}', 
      '"corrupted_legacy_document"'
    )
WHERE status = 'error';

-- Update pipeline settings to enable universal pipeline
UPDATE pipeline_settings 
SET setting_value = 'true', updated_at = now()
WHERE setting_key = 'USE_UNIVERSAL_PIPELINE';

-- Set extractor service URL (will need to be configured)
UPDATE pipeline_settings 
SET setting_value = 'http://localhost:8000', updated_at = now()
WHERE setting_key = 'EXTRACTOR_SERVICE_URL';