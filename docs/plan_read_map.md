# Mapeamento de Leitura do Plano (FASE 0)

## Resumo Executivo

**Problema identificado**: O plano aparece como "free" na página "Minha Conta" mesmo após alteração no Admin, devido a múltiplas fontes de verdade e cache divergente.

**Fonte atual**: `useSubscription` hook que chama edge function `check-subscription` baseada em Stripe API + tabela `subscribers`.

## Pontos de Leitura Identificados

### 1. Hook Principal: `src/hooks/useSubscription.tsx`
- **Fonte**: Edge function `check-subscription` (Stripe API + subscribers table)
- **Decisão "free"**: Default quando `subscription_tier` é null/undefined
- **Cache**: 30 segundos (evita chamadas frequentes)
- **Problema**: Depende de Stripe que pode ter delay/divergência

### 2. Componentes que usam `useSubscription`:

#### `src/components/SubscriptionGate.tsx` (linhas 2, 40, 44-45, 88)
- **Uso**: Controle de acesso por tier
- **Decisão "free"**: `tierLevels[subscription_tier] || 0`

#### `src/components/dashboard/tabs/AnaliseTab.tsx` (linhas 9, 14, 163, 174, 230)
- **Uso**: Limite de análises por plano (starter = 50)
- **Decisão "free"**: Sem restrições específicas

#### `src/components/dashboard/tabs/ModelosTab.tsx` (linhas 6, 10, 25, 73)
- **Uso**: Limite de templates por plano
- **Decisão "free"**: Fallback para templates estáticos

#### `src/components/sections/PricingSection.tsx` (linhas 5, 20, 103, 116, 129)
- **Uso**: Indicar plano ativo na página de preços
- **Decisão "free"**: Comparação com strings "Starter", "Professional", "Ultra"

#### `src/pages/Dashboard.tsx` (linhas 8, 16, 62)
- **Uso**: Exibir plano atual no header
- **Decisão "free"**: `subscription_tier?.charAt(0).toUpperCase() + subscription_tier?.slice(1)`

#### Outras páginas: `Checkout.tsx`, `PaymentSuccess.tsx`
- **Uso**: Verificação pós-pagamento

### 3. Base de Dados: `subscribers` table
- **Colunas relevantes**: `subscription_tier`, `subscribed`, `user_id`, `email`
- **Tipos válidos**: "free", "starter", "pro" (segundo constraint)

## Fluxo Atual Problemático

1. Admin muda plano em `subscribers.subscription_tier` ✅
2. `useSubscription` ainda tem cache de 30s ❌  
3. `check-subscription` consulta Stripe (pode estar defasado) ❌
4. UI da "Minha Conta" mostra plano antigo ❌

## Solução Proposta

**Unificar fonte**: `subscribers.subscription_tier` como única verdade
**Eliminar**: Dependência de Stripe para exibição do plano
**Adicionar**: Edge function `get-my-plan` com RLS direto no DB
**Hook novo**: `usePlan` com `forceRefreshPlan()`

## Arquivos que Precisam Mudança

- ✅ `docs/plan_read_map.md` (este arquivo)
- 🔄 `supabase/migrations/` (view + policies)
- 🔄 `supabase/functions/get-my-plan/index.ts` (nova função)
- 🔄 `src/hooks/usePlan.ts` (hook unificado)
- 🔄 `src/pages/AccountSettings.tsx` (usar novo hook)
- 🔄 `src/pages/Dashboard.tsx` (usar novo hook)
- 🔄 Todos os componentes listados acima

## Critério de Aceite

- [ ] Não restam leituras de `profiles.plan` ou `app_metadata.plan`
- [ ] Único ponto de entrada: `get-my-plan` edge function
- [ ] Admin muda próprio plano → UI atualiza imediatamente
- [ ] Outro usuário → reload mostra novo plano
- [ ] Teste negativo: sem token = 401