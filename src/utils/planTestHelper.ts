// FASE 5: Teste de aceite - Validação da unificação do plano

import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
  data?: any;
}

export const runPlanUnificationTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  const testId = crypto.randomUUID();
  
  console.log(`[PLAN-TEST] Starting unified plan tests - ${testId}`);

  // Test 1: get-my-plan endpoint without auth
  try {
    const response = await fetch(`https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1/get-my-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    results.push({
      test: 'Endpoint sem auth retorna 401',
      passed: response.status === 401,
      details: `Status: ${response.status}`,
      data: { status: response.status }
    });
  } catch (error) {
    results.push({
      test: 'Endpoint sem auth retorna 401',
      passed: false,
      details: `Erro: ${error}`,
    });
  }

  // Test 2: get-my-plan with valid auth
  try {
    const { data, error } = await supabase.functions.invoke('get-my-plan');
    
    results.push({
      test: 'Endpoint com auth retorna dados válidos',
      passed: !error && data && typeof data.plan === 'string',
      details: error ? `Erro: ${error.message}` : `Plano: ${data?.plan}`,
      data: data
    });
  } catch (error) {
    results.push({
      test: 'Endpoint com auth retorna dados válidos',
      passed: false,
      details: `Erro: ${error}`,
    });
  }

  // Test 3: Database function direct access
  try {
    const { data, error } = await supabase.rpc('get_user_plan');
    
    results.push({
      test: 'Função DB acessível via RPC',
      passed: !error && Array.isArray(data) && data.length >= 0,
      details: error ? `Erro: ${error.message}` : `Registros: ${data?.length}`,
      data: data
    });
  } catch (error) {
    results.push({
      test: 'Função DB acessível via RPC',
      passed: false,
      details: `Erro: ${error}`,
    });
  }

  // Test 4: Consistency check
  try {
    const [edgeResult, dbResult] = await Promise.all([
      supabase.functions.invoke('get-my-plan'),
      supabase.rpc('get_user_plan')
    ]);

    const edgePlan = edgeResult.data?.plan;
    const dbPlan = dbResult.data?.[0]?.plan;
    
    results.push({
      test: 'Consistência Edge Function ↔ DB Function',
      passed: edgePlan === dbPlan,
      details: `Edge: ${edgePlan} | DB: ${dbPlan}`,
      data: { edgePlan, dbPlan }
    });
  } catch (error) {
    results.push({
      test: 'Consistência Edge Function ↔ DB Function',
      passed: false,
      details: `Erro: ${error}`,
    });
  }

  console.log(`[PLAN-TEST] Tests completed - ${testId}`, results);
  return results;
};

// Execute no console do navegador:
// runPlanUnificationTests().then(console.table);