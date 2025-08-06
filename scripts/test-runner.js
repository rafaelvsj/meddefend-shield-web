#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Test runner script for document processing pipeline
async function runTests() {
  console.log('🚀 Iniciando testes automatizados...\n');
  
  // Check if Deno is available
  try {
    const { execSync } = require('child_process');
    execSync('deno --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Deno não encontrado. Instale: https://deno.land/');
    process.exit(1);
  }
  
  // Check environment variables
  const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length > 0) {
    console.error(`❌ Variáveis de ambiente faltando: ${missingEnvs.join(', ')}`);
    process.exit(1);
  }
  
  // Run the test suite
  try {
    const { execSync } = require('child_process');
    const testPath = path.join(__dirname, 'tests/document-processing/automated-test.ts');
    
    console.log('📋 Executando suite de testes...\n');
    
    const result = execSync(
      `deno run --allow-net --allow-read --allow-write "${testPath}"`,
      { 
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env }
      }
    );
    
    console.log('\n✅ Todos os testes passaram!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Alguns testes falharam');
    return false;
  }
}

// Export for npm scripts
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };