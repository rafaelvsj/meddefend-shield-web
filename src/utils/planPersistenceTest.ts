// FASE 6: Testes de verdade para persistência do plano

import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  testName: string;
  success: boolean;
  details: string;
  data?: any;
}

export class PlanPersistenceTest {
  
  /**
   * TESTE 1: Admin muda userX → pro
   * Verifica se admin-update-user-plan retorna 200 + dbEcho correto
   */
  static async testAdminUpdatePlan(userId: string, newPlan: 'free' | 'starter' | 'pro'): Promise<TestResult> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return {
          testName: 'Admin Update Plan',
          success: false,
          details: 'No active session'
        };
      }

      const { data, error } = await supabase.functions.invoke('admin-update-user-plan', {
        body: { userId, newPlan },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        return {
          testName: 'Admin Update Plan',
          success: false,
          details: `Function error: ${error.message}`,
          data: { error }
        };
      }

      const success = data?.success && 
                     data?.dbEcho?.subscription_tier === newPlan &&
                     data?.newPlan === newPlan;

      return {
        testName: 'Admin Update Plan',
        success,
        details: success 
          ? `✅ Plan updated to ${newPlan} and verified in DB`
          : `❌ Verification failed. Expected: ${newPlan}, DB Echo: ${data?.dbEcho?.subscription_tier}`,
        data
      };
    } catch (error) {
      return {
        testName: 'Admin Update Plan',
        success: false,
        details: `Exception: ${error}`,
        data: { error }
      };
    }
  }

  /**
   * TESTE 2: Verificar se admin lista mostra o plano correto após refetch
   */
  static async testAdminList(userId: string, expectedPlan: string): Promise<TestResult> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return {
          testName: 'Admin List Verification',
          success: false,
          details: 'No active session'
        };
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        return {
          testName: 'Admin List Verification',
          success: false,
          details: `Function error: ${error.message}`,
          data: { error }
        };
      }

      const user = data?.users?.find((u: any) => u.id === userId);
      const success = user?.plan === expectedPlan;

      return {
        testName: 'Admin List Verification',
        success,
        details: success 
          ? `✅ Admin list shows correct plan: ${expectedPlan}`
          : `❌ Admin list mismatch. Expected: ${expectedPlan}, Got: ${user?.plan}`,
        data: { user, allUsers: data?.users }
      };
    } catch (error) {
      return {
        testName: 'Admin List Verification',
        success: false,
        details: `Exception: ${error}`,
        data: { error }
      };
    }
  }

  /**
   * TESTE 3: Verificar plano via get-my-plan (Minha Conta)
   */
  static async testMyPlanView(expectedPlan: string): Promise<TestResult> {
    try {
      const { data, error } = await supabase.functions.invoke('get-my-plan');

      if (error) {
        return {
          testName: 'My Plan View',
          success: false,
          details: `Function error: ${error.message}`,
          data: { error }
        };
      }

      const success = data?.plan === expectedPlan;

      return {
        testName: 'My Plan View',
        success,
        details: success 
          ? `✅ My plan view shows correct plan: ${expectedPlan}`
          : `❌ My plan view mismatch. Expected: ${expectedPlan}, Got: ${data?.plan}`,
        data
      };
    } catch (error) {
      return {
        testName: 'My Plan View',
        success: false,
        details: `Exception: ${error}`,
        data: { error }
      };
    }
  }

  /**
   * TESTE 4: Verificar consistência direta no banco via view canônica
   */
  static async testCanonicalView(userId: string, expectedPlan: string): Promise<TestResult> {
    try {
      const { data, error } = await supabase
        .from('user_plan_v1')
        .select('user_id, plan, subscribed, plan_level, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return {
          testName: 'Canonical View Test',
          success: false,
          details: `DB error: ${error.message}`,
          data: { error }
        };
      }

      const success = data?.plan === expectedPlan;

      return {
        testName: 'Canonical View Test',
        success,
        details: success 
          ? `✅ Canonical view shows correct plan: ${expectedPlan}`
          : `❌ Canonical view mismatch. Expected: ${expectedPlan}, Got: ${data?.plan}`,
        data
      };
    } catch (error) {
      return {
        testName: 'Canonical View Test',
        success: false,
        details: `Exception: ${error}`,
        data: { error }
      };
    }
  }

  /**
   * TESTE COMPLETO: Executa todos os testes em sequência
   */
  static async runCompleteTest(
    userId: string, 
    newPlan: 'free' | 'starter' | 'pro'
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Teste 1: Admin update
    console.log('🧪 Running Test 1: Admin Update Plan...');
    const test1 = await this.testAdminUpdatePlan(userId, newPlan);
    results.push(test1);

    if (!test1.success) {
      console.log('❌ Test 1 failed, stopping...');
      return results;
    }

    // Aguardar 1 segundo para garantir propagação
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Admin list verification
    console.log('🧪 Running Test 2: Admin List Verification...');
    const test2 = await this.testAdminList(userId, newPlan);
    results.push(test2);

    // Teste 3: My plan view (só se for o próprio usuário)
    console.log('🧪 Running Test 3: My Plan View...');
    const test3 = await this.testMyPlanView(newPlan);
    results.push(test3);

    // Teste 4: Canonical view
    console.log('🧪 Running Test 4: Canonical View...');
    const test4 = await this.testCanonicalView(userId, newPlan);
    results.push(test4);

    return results;
  }

  /**
   * Helper para exibir resultados dos testes
   */
  static logTestResults(results: TestResult[]): void {
    console.log('\n📊 RESULTADOS DOS TESTES DE PERSISTÊNCIA:');
    console.log('==========================================');
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName}`);
      console.log(`   ${result.details}`);
      if (!result.success && result.data) {
        console.log(`   Data:`, result.data);
      }
      console.log('');
    });

    const allPassed = results.every(r => r.success);
    console.log(allPassed ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM');
  }
}

// Função utilitária para teste rápido no console
export const testPlanPersistence = async (userId: string, newPlan: 'free' | 'starter' | 'pro') => {
  const results = await PlanPersistenceTest.runCompleteTest(userId, newPlan);
  PlanPersistenceTest.logTestResults(results);
  return results;
};