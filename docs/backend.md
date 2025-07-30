# MedDefend Backend API Documentation

## Architecture Overview

O backend da MedDefend é construído com **Supabase Edge Functions**, fornecendo uma API REST distribuída e escalável para análise de documentos médicos.

### Core Components

- **Edge Functions**: Processamento serverless em Deno
- **PostgreSQL + pgvector**: Banco de dados com suporte a embeddings
- **Storage**: Armazenamento de arquivos e backups
- **Authentication**: Sistema de autenticação e autorização baseado em roles

## API Endpoints

### External API Gateway (`/external-api`)
**Gateway principal para todas as operações da API**

#### Base URL
```
https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/external-api
```

#### Endpoints Disponíveis

##### 1. Análises
```http
GET /api/v1/analyses
Authorization: Bearer <token>
```
Lista análises do usuário autenticado.

```http
POST /api/v1/analyses
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Texto do documento médico...",
  "specialty": "cardiologia",
  "templateId": "uuid-opcional"
}
```
Cria nova análise de documento.

##### 2. Templates
```http
GET /api/v1/templates
Authorization: Bearer <token>
```
Lista templates públicos disponíveis.

##### 3. Base de Conhecimento
```http
POST /api/v1/knowledge-base/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "termo de busca",
  "limit": 3
}
```
Busca semantica na base de conhecimento.

##### 4. Webhooks
```http
POST /api/v1/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://exemplo.com/webhook",
  "events": ["analysis_complete", "template_created"],
  "name": "Meu Webhook"
}
```
Registra webhook para eventos.

```http
POST /api/v1/webhook/trigger
Content-Type: application/json

{
  "event": "analysis_complete",
  "data": { ... }
}
```
Endpoint público para receber webhooks.

##### 5. Métricas (Admin Only)
```http
GET /api/v1/metrics
Authorization: Bearer <admin-token>
```
Estatísticas do sistema para administradores.

### Health Check (`/healthz`)
**Endpoint público para monitoramento**

```http
GET /healthz
```

Resposta:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T12:00:00Z",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "latency_ms": 25
    },
    {
      "service": "ai_service",
      "status": "healthy", 
      "latency_ms": 150,
      "provider": "gemini"
    },
    {
      "service": "job_queue",
      "status": "healthy",
      "latency_ms": 10,
      "details": {
        "pending_jobs": 2,
        "stuck_jobs": 0
      }
    }
  ]
}
```

### Admin Functions

#### Admin Logs (`/admin-logs`)
**Acesso administrativo aos logs do sistema**

```http
GET /admin-logs?action=get_logs&level=error&limit=50
Authorization: Bearer <admin-token>
```

#### Backup Management (`/backup`)
**Sistema de backup automático**

```http
POST /backup
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "action": "create_full"
}
```

#### Cache Management (`/cache`)
**Sistema de cache distribuído**

```http
POST /cache
Content-Type: application/json

{
  "action": "get",
  "key": "analysis:cardiologia:abc123"
}
```

## Authentication & Authorization

### Roles
- **user**: Usuário padrão
- **admin**: Administrador do sistema

### JWT Claims
```json
{
  "sub": "user-uuid",
  "email": "user@example.com", 
  "role": "user",
  "exp": 1640995200
}
```

### Rate Limiting
Baseado em subscription tier:
- **Free**: 5 análises/hora
- **Starter**: 50 análises/hora  
- **Pro**: 500 análises/hora
- **Enterprise**: Ilimitado

## Data Models

### Analysis Request
```typescript
interface AnalysisRequest {
  text: string;          // 10-50000 chars
  specialty: 'cardiologia' | 'neurologia' | 'clinica-geral' | 'pediatria';
  templateId?: string;   // UUID opcional
}
```

### Analysis Response
```typescript
interface AnalysisResult {
  analysis_id: string;
  score: number;
  risk_level: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  suggestions: string[];
  improvements: string[];
  cfm_compliance: boolean;
  analysis_result: {
    // Resultado detalhado da análise
  };
}
```

### Error Response
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}
```

## Security

### OWASP Headers
Todas as respostas incluem headers de segurança:
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

### Input Validation
- Sanitização automática de inputs
- Validação de tipos e ranges
- Detecção de conteúdo malicioso

### Data Privacy
- Logs não contêm informações pessoais
- Embeddings são anonimizados
- Compliance com LGPD

## Monitoring & Observability

### Structured Logging
```json
{
  "timestamp": "2024-01-30T12:00:00Z",
  "level": "info",
  "message": "Analysis completed",
  "context": {
    "function_name": "analyze-text-v2",
    "request_id": "uuid",
    "user_id": "uuid",
    "duration_ms": 1250
  }
}
```

### Metrics
- Latência por endpoint
- Taxa de erro por função
- Uso de cache
- Performance de embeddings

### External Integrations
- **Logflare**: Agregação de logs (opcional)
- **Sentry**: Error tracking (opcional)

## Environment Variables

### Required
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço
- `GEMINI_API_KEY`: Chave da API Gemini

### Optional
- `OPENAI_API_KEY`: Chave da API OpenAI
- `LOG_SINK_URL`: URL do Logflare
- `SENTRY_DSN`: DSN do Sentry
- `DEBUG`: Habilita logs debug

## Error Codes

### HTTP Status Codes
- `200`: Sucesso
- `400`: Bad Request (dados inválidos)
- `401`: Unauthorized (token inválido)
- `403`: Forbidden (sem permissão)
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

### Custom Error Codes
- `INSUFFICIENT_SUBSCRIPTION`: Upgrade necessário
- `ANALYSIS_FAILED`: Erro na análise de IA
- `FILE_PROCESSING_ERROR`: Erro no processamento de arquivo
- `EMBEDDING_GENERATION_FAILED`: Erro na geração de embeddings

## Development

### Local Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Start local development
supabase start

# Deploy functions
supabase functions deploy
```

### Testing
```bash
# Test specific function
supabase functions serve analyze-text-v2

# Test with curl
curl -X POST http://localhost:54321/functions/v1/analyze-text-v2 \
  -H "Content-Type: application/json" \
  -d '{"text": "...", "specialty": "cardiologia"}'
```

### Database Migrations
```bash
# Create migration
supabase migration new add_feature

# Apply migrations
supabase db push
```

## Performance Guidelines

### Best Practices
1. **Cache**: Use cache para análises repetidas
2. **Batch Processing**: Processe múltiplos documentos em lote
3. **Async Operations**: Use background jobs para operações longas
4. **Connection Pooling**: Reutilize conexões de database

### Rate Limiting Strategy
```typescript
// Check rate limit before processing
const rateLimitResult = await checkRateLimit(userId, 'analyses');
if (!rateLimitResult.allowed) {
  return error429(rateLimitResult.resetTime);
}
```

### Caching Strategy
```typescript
// Cache analysis results
const cacheKey = CacheKeys.ANALYSIS(text, specialty);
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await performAnalysis(text, specialty);
await cache.set(cacheKey, result, 3600); // 1 hour
```

## Troubleshooting

### Common Issues

#### 1. Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "resetTime": "2024-01-30T13:00:00Z"
}
```
**Solução**: Aguardar reset ou upgrade de plano.

#### 2. Analysis Timeout
```json
{
  "error": "Analysis timeout",
  "code": "ANALYSIS_TIMEOUT"
}
```
**Solução**: Reduzir tamanho do texto ou tentar novamente.

#### 3. Embedding Generation Failed
```json
{
  "error": "Embedding generation failed",
  "code": "EMBEDDING_GENERATION_FAILED"
}
```
**Solução**: Verificar GEMINI_API_KEY e quota.

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true

# Check logs
supabase functions logs analyze-text-v2
```

### Support
- **Email**: support@meddefend.com
- **Discord**: [Link do Discord]
- **Documentation**: https://docs.meddefend.com