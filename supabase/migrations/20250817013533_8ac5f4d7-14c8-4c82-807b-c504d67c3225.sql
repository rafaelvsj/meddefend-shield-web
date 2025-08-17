-- Fonte de verdade do plano continua sendo subscribers.subscription_tier

-- 1) Garantir índice único por usuário (não conflita com Stripe)
CREATE UNIQUE INDEX IF NOT EXISTS ux_subscribers_user_id ON public.subscribers (user_id);

-- 2) Check tolerante para valores canônicos (não quebra nulos legacy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subscribers_plan_values'
  ) THEN
    ALTER TABLE public.subscribers
      ADD CONSTRAINT chk_subscribers_plan_values
      CHECK (subscription_tier IS NULL OR subscription_tier IN ('free','starter','pro'));
  END IF;
END$$;

-- 3) (Opcional-recomendado) Apertar política permissiva
-- Se existir policy "update_own_subscription" com USING(true), troque por:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscribers' AND policyname='update_own_subscription'
  ) THEN
    DROP POLICY IF EXISTS update_own_subscription ON public.subscribers;
    CREATE POLICY update_own_subscription ON public.subscribers
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 4) Trigger de auditoria (se a função já existir, só cria o gatilho)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_audit_plan_changes'
  ) THEN
    CREATE TRIGGER trg_audit_plan_changes
    AFTER INSERT OR UPDATE OF subscription_tier ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.audit_plan_changes();
  END IF;
END$$;