# Scanner Anti-Sobrescrita - Locais que Escrevem Planos

## Resumo Executivo
**Objetivo**: Detectar todos os pontos que fazem UPDATE/UPSERT em `subscribers` ou calculam "plano".
**Ação requerida**: Migrar estes pontos para usar `set_user_plan()` função central.

## Edge Functions que Escrevem Planos

### ✅ admin-update-user-plan/index.ts
- **Ação**: UPDATE/UPSERT direto em `subscribers`  
- **Linha**: ~121-130
- **Status**: 🔄 SERÁ MIGRADO para usar `set_user_plan('admin', userId, newPlan)`

### ⚠️ check-subscription/index.ts
- **Ação**: UPDATE em `subscribers.subscription_tier`
- **Linha**: Múltiplas (verifica Stripe e atualiza)
- **Status**: 🚨 PRECISA MIGRAÇÃO para `set_user_plan('stripe-webhook', userId, tier)`

## Hooks Frontend (Somente Leitura)

### ✅ src/hooks/usePlan.ts
- **Ação**: Somente READ via get-my-plan
- **Status**: ✅ OK - usa fonte canônica

### ✅ src/hooks/useSubscription.tsx  
- **Ação**: Somente READ via check-subscription
- **Status**: ⚠️ MIGRAR para usePlan.ts

## Componentes que Leem Planos

### ✅ src/components/SubscriptionGate.tsx
- **Status**: ✅ MIGRADO para usePlan.ts

### ✅ src/components/dashboard/tabs/AnaliseTab.tsx  
- **Status**: ✅ MIGRADO para usePlan.ts

### ✅ src/components/dashboard/tabs/ModelosTab.tsx
- **Status**: ✅ MIGRADO para usePlan.ts

## Funções SQL que Escrevem

### ✅ public.set_user_plan()
- **Ação**: Função central para escrita
- **Status**: ✅ CRIADA - todas as escritas devem usar esta função

### ⚠️ public.get_user_plan()
- **Ação**: Somente READ via view user_plan_v1
- **Status**: ✅ OK - usa fonte canônica

## Arquivos de Configuração

### ❌ Sem detecção de writes em:
- `profiles.plan` (não encontrado)
- `app_metadata.plan` (não encontrado) 
- Webhooks Stripe diretos (não detectados)

## Pontos Críticos para Migração

1. **check-subscription/index.ts**: MIGRAR todas as escritas para `set_user_plan('stripe-webhook', userId, tier)`
2. **admin-update-user-plan/index.ts**: MIGRAR para `set_user_plan('admin', userId, newPlan)`
3. **Qualquer webhook Stripe**: Usar `set_user_plan('stripe-webhook', userId, tier)`

## Prevenção de Sobrescrita

### ✅ Implementado:
- Função central `set_user_plan()` com auditoria
- Validação de `source` (admin, stripe-webhook, manual, system)
- Log automático em `audit_logs`

### 🔄 Próximos Passos:
1. Migrar `admin-update-user-plan` para usar `set_user_plan()`
2. Migrar `check-subscription` para usar `set_user_plan()`  
3. Adicionar restrições RLS que bloqueiem writes diretos em `subscribers`

## Teste de Verificação

```sql
-- Verificar se alguma função ainda escreve direto
SELECT * FROM audit_logs 
WHERE action = 'PLAN_CHANGE_CENTRALIZED' 
ORDER BY timestamp DESC LIMIT 10;

-- Verificar integridade dos planos
SELECT user_id, plan, updated_at 
FROM user_plan_v1 
WHERE user_id = 'test-user-id';
```