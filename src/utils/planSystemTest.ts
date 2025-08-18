// Teste E2E do sistema de planos após correções FASE 2/3

import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export class PlanSystemTester {
  private results: TestResult[] = [];
  
  private log(step: string, success: boolean, data?: any, error?: string) {
    const result = { step, success, data, error };
    this.results.push(result);
    console.log(`[PLAN TEST] ${step}: ${success ? '✅' : '❌'}`, { data, error });
  }

  async testAdminPlanChange(targetUserId: string, newPlan: string, reason: string) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-plan', {
        body: { userId: targetUserId, newPlan, reason }
      });
      
      if (error) throw error;
      
      this.log('Admin Plan Change', true, data);
      return data;
    } catch (error) {
      this.log('Admin Plan Change', false, null, error.message);
      throw error;
    }
  }

  async testGetUserPlan(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_user_plan', { target_user_id: userId });
      
      if (error) throw error;
      
      this.log('Get User Plan', true, data?.[0]);
      return data?.[0];
    } catch (error) {
      this.log('Get User Plan', false, null, error.message);
      throw error;
    }
  }

  async testChatRateLimit(text: string, specialty: string) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text-v2', {
        body: { text, specialty, userId: (await supabase.auth.getUser()).data.user?.id }
      });
      
      if (error && error.message?.includes('quota_exceeded')) {
        this.log('Chat Rate Limit', true, { message: 'Rate limit triggered as expected' });
        return { rateLimited: true, error: error.message };
      } else if (error) {
        throw error;
      }
      
      this.log('Chat Rate Limit', true, { message: 'Request allowed' });
      return { rateLimited: false, data };
    } catch (error) {
      this.log('Chat Rate Limit', false, null, error.message);
      throw error;
    }
  }

  async testStripeWebhookPrecedence(userId: string, adminPlan: string, stripePlan: string) {
    try {
      // 1. Admin muda para adminPlan
      await this.testAdminPlanChange(userId, adminPlan, 'Test admin precedence');
      
      // 2. Simular webhook do Stripe tentando mudar para stripePlan
      const { data, error } = await supabase.rpc('set_user_plan', {
        p_source: 'stripe-webhook',
        p_user_id: userId,
        p_new_plan: stripePlan,
        p_reason: 'Test stripe webhook'
      });
      
      if (error) throw error;
      
      // 3. Verificar se manteve o plano do admin (precedência)
      const currentPlan = await this.testGetUserPlan(userId);
      const maintained = currentPlan.plan === adminPlan;
      
      this.log('Stripe Webhook Precedence', maintained, { 
        adminPlan, 
        stripePlan, 
        currentPlan: currentPlan.plan,
        precedenceBlocked: (data as any)?.precedence_blocked 
      });
      
      return { maintained, currentPlan, precedenceResult: data };
    } catch (error) {
      this.log('Stripe Webhook Precedence', false, null, error.message);
      throw error;
    }
  }

  async testAuditTrail(userId: string) {
    try {
      const { data, error } = await supabase
        .from('audit_user_plan_changes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      this.log('Audit Trail', true, { count: data.length, latest: data[0] });
      return data;
    } catch (error) {
      this.log('Audit Trail', false, null, error.message);
      throw error;
    }
  }

  async testSessionVersionBump(userId: string) {
    try {
      // Buscar session_version atual
      const { data: before, error: beforeError } = await supabase
        .from('subscribers')
        .select('session_version')
        .eq('user_id', userId)
        .single();
      
      if (beforeError) throw beforeError;
      
      // Fazer mudança de plano
      await this.testAdminPlanChange(userId, 'pro', 'Test session version bump');
      
      // Buscar session_version depois
      const { data: after, error: afterError } = await supabase
        .from('subscribers')
        .select('session_version')
        .eq('user_id', userId)
        .single();
      
      if (afterError) throw afterError;
      
      const bumped = after.session_version > before.session_version;
      
      this.log('Session Version Bump', bumped, { 
        before: before.session_version, 
        after: after.session_version 
      });
      
      return { before: before.session_version, after: after.session_version, bumped };
    } catch (error) {
      this.log('Session Version Bump', false, null, error.message);
      throw error;
    }
  }

  async runFullTest(targetUserId: string) {
    console.log('🧪 Iniciando teste completo do sistema de planos');
    
    try {
      // Teste 1: Mudança de plano pelo admin
      console.log('\n📋 Teste 1: Admin Plan Change');
      await this.testAdminPlanChange(targetUserId, 'pro', 'E2E Test - Admin Change');
      
      // Teste 2: Leitura do plano
      console.log('\n📋 Teste 2: Get User Plan');
      const planAfterAdmin = await this.testGetUserPlan(targetUserId);
      
      // Teste 3: Precedência admin > stripe
      console.log('\n📋 Teste 3: Stripe Webhook Precedence');
      await this.testStripeWebhookPrecedence(targetUserId, 'pro', 'free');
      
      // Teste 4: Auditoria
      console.log('\n📋 Teste 4: Audit Trail');
      await this.testAuditTrail(targetUserId);
      
      // Teste 5: Session version bump
      console.log('\n📋 Teste 5: Session Version Bump');
      await this.testSessionVersionBump(targetUserId);
      
      // Teste 6: Rate limit do chat
      console.log('\n📋 Teste 6: Chat Rate Limit');
      await this.testChatRateLimit('Teste de análise médica', 'cardiologia');
      
      console.log('\n✅ Teste completo finalizado');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
    }
  }

  printSummary() {
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('═'.repeat(50));
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.step}`);
      if (!result.success) {
        console.log(`   Erro: ${result.error}`);
      }
    });
    
    console.log('═'.repeat(50));
    console.log(`📈 Resultado: ${passed}/${total} testes passaram`);
    
    if (passed === total) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
    } else {
      console.log('⚠️ Alguns testes falharam. Verificar logs acima.');
    }
  }

  getResults() {
    return this.results;
  }
}

// Função de conveniência para teste rápido
export const testPlanSystem = async (targetUserId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Usuário não autenticado para teste');
    return;
  }
  
  const testUserId = targetUserId || user.id;
  const tester = new PlanSystemTester();
  await tester.runFullTest(testUserId);
  return tester.getResults();
};

// Exportar para console global para facilitar testes manuais
if (typeof window !== 'undefined') {
  (window as any).testPlanSystem = testPlanSystem;
  (window as any).PlanSystemTester = PlanSystemTester;
}