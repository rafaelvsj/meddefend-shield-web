#!/bin/bash

echo "🚀 EXECUTANDO VALIDAÇÃO DA PIPELINE UNIVERSAL COM OPENAI"
echo "========================================================="

# Verificar se Deno está instalado
if ! command -v deno &> /dev/null; then
    echo "❌ Deno não encontrado. Instale o Deno primeiro."
    exit 1
fi

# Verificar variáveis de ambiente
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY não configurado"
    echo "   Configure a variável de ambiente antes de executar"
    exit 1
fi

echo "✅ Pré-requisitos verificados"
echo ""

# Executar o teste de validação
echo "🔄 Executando testes..."
deno run --allow-net --allow-read --allow-write tests/validation-pipeline-openai.ts

echo ""
echo "✅ Validação concluída"