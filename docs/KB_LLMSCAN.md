# RELATÓRIO DE DESCOBERTA KB/LLM - FASE 0

## ⚠️ DIVERGÊNCIAS CRÍTICAS DETECTADAS

### ÂNCORAS ESPERADAS vs REALIDADE
- ❌ **knowledge_base** tem **2 arquivos** (não corresponde aos prints esperados)
- ❌ **llm_settings** tem **13 configurações** (diverge do esperado)
- ❌ **document_chunks** = **0** (sem chunks processados)
- ❌ **kb_processing_logs** = **5 logs** (atividade recente)
- ❌ **pipeline_settings** = **10 configurações** (pipeline ativo)

## TABELAS KB/LLM MAPEADAS (NOMES REAIS)
```
document_chunks - 0 registros
document_templates - [quantidade não verificada]
kb_processing_logs - 5 registros  
knowledge_base - 2 registros
llm_settings - 13 registros
pipeline_settings - 10 registros
```

## ROTAS/ARQUIVOS UI IDENTIFICADOS
### Páginas Principais
- `src/pages/admin/AdminKnowledgeBase.tsx` (1049 linhas)
- `src/pages/admin/AdminLLMSettings.tsx` (384 linhas)

### Layout/Rotas
- `src/components/AdminLayout.tsx` 
  - Linha 66: `{ title: "Knowledge Base", url: "/admin/knowledge-base", icon: BookOpen }`
  - Linha 67: `{ title: "LLM Settings", url: "/admin/llm-settings", icon: Brain }`
  - Linha 210: `<Route path="/knowledge-base" element={<AdminKnowledgeBase />} />`
  - Linha 211: `<Route path="/llm-settings" element={<AdminLLMSettings />} />`

## EDGE FUNCTIONS IDENTIFICADAS (46 arquivos afetados)
### Críticas para KB/LLM:
- `admin-kb-logs/index.ts`
- `admin-system-settings/index.ts` 
- `analyze-text-v2/index.ts`
- `backup/index.ts`
- `document-processor-v2/index.ts`
- `process-document-optimized/index.ts`
- `process-document/index.ts`
- `quality-validator/index.ts`
- `retry-failed-documents/index.ts`
- `search-knowledge/index.ts`
- `test-kb-insert/index.ts`

### Storage Buckets
- `knowledge-base` (bucket não-público)

## ENV/SECRETS RELACIONADAS
**Identificadas no código:**
- `KB_*` - patterns encontrados em várias functions
- `LLM_*` - settings específicas 
- `PIPELINE_*` - configurações do pipeline
- `GEMINI_API_KEY` - usado para embeddings
- `OPENAI_API_KEY` - usado para embeddings
- **PRESERVAR:** `OPENAI_*` usado pelo chat principal

## STATUS DE SAÚDE (Fase 0)
- ✅ App funcionando em /
- ⚠️ **BLOQUEIO:** Divergências críticas nas âncoras impedem prosseguimento
- ❌ Não executamos testes até resolução das divergências

## PRÓXIMAS AÇÕES NECESSÁRIAS
1. **PARAR** - Não prosseguir sem alinhamento de âncoras
2. Confirmar se os **2 arquivos** em knowledge_base devem ser preservados/removidos
3. Confirmar se as **13 configurações** LLM devem ser zeradas completamente
4. Validar se pipeline_settings com **10 configurações** deve ser limpo

## COMPONENTES CRÍTICOS /admin/users
- ❌ **SEM FUNCIONALIDADE DE TROCA DE PLANO** detectada
- Apenas visualização básica, sem dropdowns/botões de alteração
- Hook `useAdminUsers` não possui função `updateUserPlan`