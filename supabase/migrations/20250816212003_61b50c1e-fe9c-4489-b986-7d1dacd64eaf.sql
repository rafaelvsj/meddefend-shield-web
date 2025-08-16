-- FASE 2: LIMPEZA CONTROLADA KB/LLM
-- Backup automático através de soft-delete com timestamps

-- 1. Soft-delete knowledge_base (manter histórico)
UPDATE knowledge_base 
SET status = 'deleted', 
    updated_at = now(),
    processing_logs = jsonb_set(
      COALESCE(processing_logs, '{}'),
      '{cleanup_date}',
      to_jsonb(now()::text)
    )
WHERE status != 'deleted';

-- 2. Limpar document_chunks relacionados
DELETE FROM document_chunks 
WHERE knowledge_base_id IN (
  SELECT id FROM knowledge_base WHERE status = 'deleted'
);

-- 3. Soft-delete llm_settings (manter backup)
UPDATE llm_settings 
SET setting_value = 'DISABLED_' || setting_value,
    updated_at = now(),
    description = 'CLEANED_' || COALESCE(description, '')
WHERE NOT setting_value LIKE 'DISABLED_%';

-- 4. Soft-delete pipeline_settings 
UPDATE pipeline_settings
SET setting_value = 'DISABLED_' || setting_value,
    updated_at = now(),
    description = 'CLEANED_' || COALESCE(description, '')
WHERE NOT setting_value LIKE 'DISABLED_%';

-- 5. Limpar kb_processing_logs (manter apenas últimos 2 dias como histórico)
DELETE FROM kb_processing_logs 
WHERE created_at < now() - INTERVAL '2 days';

-- 6. Adicionar trigger de auditoria para mudanças de plano
CREATE OR REPLACE FUNCTION audit_plan_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log mudanças de plano na tabela subscribers
  IF TG_OP = 'UPDATE' AND OLD.subscription_tier != NEW.subscription_tier THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      timestamp
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'PLAN_CHANGE',
      'subscription',
      NEW.user_id::text,
      jsonb_build_object(
        'old_plan', OLD.subscription_tier,
        'new_plan', NEW.subscription_tier,
        'changed_by', auth.uid(),
        'timestamp', now()
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela subscribers
DROP TRIGGER IF EXISTS plan_change_audit ON subscribers;
CREATE TRIGGER plan_change_audit
  AFTER UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION audit_plan_changes();