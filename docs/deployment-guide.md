# Universal Document Processing Pipeline - Deployment Guide

## Micro-serviço Python - Cloud Run Deploy

### 1. Build e Deploy

```bash
# Build da imagem
docker build -t gcr.io/[PROJECT-ID]/document-extractor:latest .

# Push para Container Registry
docker push gcr.io/[PROJECT-ID]/document-extractor:latest

# Deploy no Cloud Run
gcloud run deploy document-extractor \
  --image gcr.io/[PROJECT-ID]/document-extractor:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10
```

### 2. Alternativa: Railway Deploy

```bash
# Via Railway CLI
railway login
railway init
railway up
```

### 3. Docker Compose Local

```yaml
version: '3.8'
services:
  extractor:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
    volumes:
      - /tmp:/tmp
```

### 4. Configuração Supabase Secrets

```sql
-- Configurar URL do serviço
INSERT INTO vault.secrets (name, secret) 
VALUES ('EXTRACTOR_SERVICE_URL', 'https://your-service-url.run.app');

-- Habilitar pipeline universal
INSERT INTO vault.secrets (name, secret) 
VALUES ('USE_UNIVERSAL_PIPELINE', 'true');
```

## Verificação de Saúde

```bash
curl https://your-service-url.run.app/health
# Deve retornar: {"status": "healthy", "service": "document-extractor"}
```