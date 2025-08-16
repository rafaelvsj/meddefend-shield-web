# RELATÓRIO DE BACKUP KB/LLM - FASE 1

## BACKUP EXECUTADO EM: 2025-08-16

### DADOS COLETADOS ANTES DA LIMPEZA

#### 📊 CONTADORES FINAIS
- **knowledge_base**: 2 arquivos
- **llm_settings**: 13 configurações  
- **pipeline_settings**: 10 configurações
- **document_chunks**: 0 registros
- **kb_processing_logs**: 5 registros

#### 📁 ARQUIVOS IDENTIFICADOS EM knowledge_base
1. **arquivo-teste.txt** (ID: 7a6a3a6d-0a00-4d85-bc41-c64a50f41a7e)
   - Tamanho: 123 bytes
   - Status: processing
   - Criado: 2025-08-13 12:21:50
   
2. **prontuario_medico_paciente_medicina_defensiva.pdf** (ID: a83413b5-65f3-4bfb-bed6-bdce2796a00b)
   - Tamanho: 918,893 bytes
   - Status: processing  
   - Criado: 2025-08-13 12:09:19
   - Observação: Documento com extração problemática

#### 🔧 CONFIGURAÇÕES LLM ATIVAS
- **master_instructions**: Instruções globais do LLM
- **maintenance_mode**: false
- **auto_retry_analyses**: true
- **max_retry_attempts**: 3
- **require_2fa**: false
- **session_timeout**: true
- **session_duration**: 8 horas
- **request_timeout**: 30 segundos
- **system_name**: MedDefend Admin
- **admin_email**: admin@meddefend.com
- **PIPELINE_QUALITY_THRESHOLD**: 0.99
- **USE_UNIVERSAL_PIPELINE**: true
- **EXTRACTOR_SERVICE_URL**: https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/document-extract

#### 📦 STORAGE BUCKETS
- **knowledge-base**: Bucket não-público identificado

#### 🔐 ENV/SECRETS PRESERVADAS
- OPENAI_API_KEY ✅ (mantida - usada pelo chat)
- GEMINI_API_KEY ✅ (mantida - usada pelo chat)

### STATUS DO BACKUP
✅ **COMPLETO** - Todos os dados catalogados e prontos para limpeza
