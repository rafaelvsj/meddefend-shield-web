import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class RateLimiter {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async checkRateLimit(userId: string, endpoint: string, subscriptionTier: string): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const tierLimits = {
      'free': { analyses: 5, templates: 2, knowledge_base: 1 },
      'starter': { analyses: 50, templates: 10, knowledge_base: 5 },
      'pro': { analyses: 500, templates: 50, knowledge_base: 20 },
      'enterprise': { analyses: -1, templates: -1, knowledge_base: -1 } // Unlimited
    };

    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    const limit = tierLimits[subscriptionTier]?.[endpoint] || tierLimits.free[endpoint];
    
    if (limit === -1) {
      return { allowed: true, remaining: -1, resetTime: new Date() };
    }

    // Buscar ou criar registro de rate limit
    const { data: rateLimit, error } = await this.supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('window_start', currentHour.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // Não é "not found"
      throw error;
    }

    if (!rateLimit) {
      // Criar novo registro
      await this.supabaseClient
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint,
          requests_count: 1,
          window_start: currentHour.toISOString(),
          tier_limit: limit
        });

      return { 
        allowed: true, 
        remaining: limit - 1, 
        resetTime: new Date(currentHour.getTime() + 3600000) 
      };
    }

    if (rateLimit.requests_count >= limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: new Date(currentHour.getTime() + 3600000) 
      };
    }

    // Incrementar contador
    await this.supabaseClient
      .from('rate_limits')
      .update({ requests_count: rateLimit.requests_count + 1 })
      .eq('id', rateLimit.id);

    return { 
      allowed: true, 
      remaining: limit - (rateLimit.requests_count + 1), 
      resetTime: new Date(currentHour.getTime() + 3600000) 
    };
  }

  async resetRateLimits(userId: string): Promise<void> {
    await this.supabaseClient
      .from('rate_limits')
      .delete()
      .eq('user_id', userId);
  }
}

class WebhookService {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async triggerWebhooks(event: string, payload: any): Promise<void> {
    const { data: webhooks } = await this.supabaseClient
      .from('webhooks')
      .select('*')
      .contains('events', [event])
      .eq('active', true);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      try {
        await this.callWebhook(webhook, event, payload);
      } catch (error) {
        console.error(`Webhook failed: ${webhook.url}`, error);
      }
    }
  }

  private async callWebhook(webhook: any, event: string, payload: any): Promise<void> {
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret_key || '',
        'X-Event-Type': event
      },
      body: JSON.stringify(webhookPayload)
    });

    // Atualizar estatísticas do webhook
    await this.supabaseClient
      .from('webhooks')
      .update({
        last_triggered: new Date().toISOString(),
        total_triggers: webhook.total_triggers + 1
      })
      .eq('id', webhook.id);

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status}`);
    }
  }

  async registerWebhook(webhookData: any): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('webhooks')
      .insert(webhookData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

class ComplianceFilter {
  private static readonly MEDICAL_TERMS = [
    'prontuário', 'diagnóstico', 'tratamento', 'medicamento', 'paciente',
    'cirurgia', 'exame', 'procedimento', 'prescrição'
  ];

  private static readonly FORBIDDEN_PATTERNS = [
    /cpf[:\s]*\d{3}\.?\d{3}\.?\d{3}-?\d{2}/gi,
    /rg[:\s]*\d+/gi,
    /senha[:\s]*\w+/gi,
    /password[:\s]*\w+/gi
  ];

  static filterContent(text: string): { filtered: string; violations: string[] } {
    let filtered = text;
    const violations: string[] = [];

    // Verificar padrões proibidos
    this.FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(filtered)) {
        violations.push('Informação sensível detectada');
        filtered = filtered.replace(pattern, '[DADOS REDACTED]');
      }
    });

    // Verificar se contém termos médicos apropriados
    const hasMedicalTerms = this.MEDICAL_TERMS.some(term => 
      filtered.toLowerCase().includes(term)
    );

    if (!hasMedicalTerms && filtered.length > 100) {
      violations.push('Conteúdo pode não ser relevante para análise médica');
    }

    return { filtered, violations };
  }

  static validateAnalysisCompliance(analysisResult: any): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!analysisResult.cfm_compliance) {
      issues.push('Análise não está em compliance com CFM');
    }

    if (analysisResult.risk_level === 'Crítico') {
      issues.push('Análise indica risco crítico - revisão manual necessária');
    }

    if (!analysisResult.suggestions || analysisResult.suggestions.length === 0) {
      issues.push('Análise deve conter sugestões de melhoria');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'check_rate_limit': {
        const rateLimiter = new RateLimiter(supabaseClient);
        const result = await rateLimiter.checkRateLimit(
          payload.userId,
          payload.endpoint,
          payload.subscriptionTier
        );
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'trigger_webhooks': {
        const webhookService = new WebhookService(supabaseClient);
        await webhookService.triggerWebhooks(payload.event, payload.data);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'register_webhook': {
        const webhookService = new WebhookService(supabaseClient);
        const webhook = await webhookService.registerWebhook(payload);
        
        return new Response(JSON.stringify({ webhook }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'filter_content': {
        const result = ComplianceFilter.filterContent(payload.text);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate_compliance': {
        const result = ComplianceFilter.validateAnalysisCompliance(payload.analysisResult);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in integrations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});