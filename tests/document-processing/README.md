# Document Processing Test Suite

Este diretório contém testes automatizados para validar o pipeline universal de processamento de documentos.

## Estrutura

```
tests/document-processing/
├── test-files/              # Arquivos de exemplo para cada formato
│   ├── sample.txt           # Texto simples
│   ├── sample.html          # HTML estruturado
│   ├── sample.pdf           # PDF com texto (adicionar manualmente)
│   ├── sample.docx          # DOCX (adicionar manualmente)
│   ├── sample.pptx          # PPTX (adicionar manualmente)
│   └── sample.png           # Imagem com texto (adicionar manualmente)
├── automated-test.ts        # Suite de testes automatizados
└── README.md               # Este arquivo
```

## Executando os Testes

### Pré-requisitos

1. **Variáveis de ambiente configuradas:**
```bash
export SUPABASE_URL="https://zwgjnynnbxiomtnnvztt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="seu_service_role_key"
```

2. **Serviço de extração rodando (opcional):**
```bash
# Se USE_UNIVERSAL_PIPELINE=true
export EXTRACTOR_SERVICE_URL="http://localhost:8000"
export USE_UNIVERSAL_PIPELINE="true"
```

### Comando de Teste

```bash
# Executar todos os testes
deno run --allow-net --allow-read --allow-write automated-test.ts

# Ou usar como módulo npm
npm run test:kbase
```

## Validações Realizadas

Para cada arquivo de teste, o sistema valida:

✅ **Status**: Documento processado com sucesso  
✅ **Similaridade**: Score ≥ 99% entre texto original e markdown  
✅ **Tamanho**: Texto extraído tem tamanho mínimo esperado  
✅ **Markdown**: Conversão para markdown foi realizada  
✅ **MIME Type**: Detecção correta do tipo de arquivo  
✅ **Palavras-chave**: Termos importantes preservados  
✅ **Embeddings**: Chunks criados e embeddings gerados  
✅ **Sem erros**: Nenhum erro de validação reportado  

## Formatos Suportados

| Formato | Implementado | Método de Extração | OCR |
|---------|--------------|-------------------|-----|
| PDF | ✅ | pdfplumber / fallback | ❌ |
| DOCX | ✅ | mammoth / python-docx | ❌ |
| PPTX | ✅ | python-pptx | ❌ |
| HTML | ✅ | BeautifulSoup | ❌ |
| TXT | ✅ | encoding detection | ❌ |
| RTF | ✅ | pandoc / fallback | ❌ |
| EPUB | ✅ | ebooklib | ❌ |
| JPG/PNG | ✅ | pytesseract | ✅ |
| TIFF/BMP | ✅ | pytesseract | ✅ |

## Adicionando Novos Formatos

1. **Criar extractor** em `supabase/functions/document-extract-service/extractors/`
2. **Registrar no main.py** no dicionário `extractors`
3. **Adicionar arquivo de teste** em `test-files/`
4. **Atualizar TEST_FILES** em `automated-test.ts`
5. **Executar testes** para validar

## Estrutura de Logs

Os logs de processamento incluem:

- `STARTED`: Início do processamento
- `METADATA`: Informações do arquivo
- `DOWNLOADED`: Download do storage
- `MIME_DETECTED`: Tipo detectado
- `EXTRACTED`: Extração de texto
- `MARKDOWN`: Conversão para markdown
- `SIMILARITY`: Cálculo de similaridade
- `QUALITY_FAILED/PASSED`: Gate de qualidade
- `CHUNKED`: Criação de chunks
- `EMBEDDINGS`: Geração de embeddings
- `COMPLETED`: Processamento finalizado

## Rollback e Feature Flags

```bash
# Desabilitar pipeline universal (usar fallback)
export USE_UNIVERSAL_PIPELINE="false"

# Habilitar pipeline universal
export USE_UNIVERSAL_PIPELINE="true"
export EXTRACTOR_SERVICE_URL="http://your-service:8000"
```

## Métricas de Sucesso

- **Taxa de sucesso**: ≥ 95% dos documentos processados
- **Similaridade média**: ≥ 99%
- **Tempo de processamento**: < 60s por documento
- **Cobertura de formatos**: Todos os formatos listados
- **Ausência de regressões**: Funcionalidades existentes intactas