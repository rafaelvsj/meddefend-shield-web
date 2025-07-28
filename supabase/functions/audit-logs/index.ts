import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
}

class AuditService {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('audit_logs')
        .insert({
          ...entry,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging audit entry:', error);
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  }

  async getActivityLogs(filters: any = {}, limit: number = 50): Promise<any[]> {
    let query = this.supabaseClient
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }

    if (filters.start_date) {
      query = query.gte('timestamp', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('timestamp', filters.end_date);
    }

    const { data } = await query;
    return data || [];
  }

  async generateReport(userId: string, reportType: 'activity' | 'analysis' | 'usage'): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (reportType) {
      case 'activity':
        return this.generateActivityReport(userId, thirtyDaysAgo, now);
      case 'analysis':
        return this.generateAnalysisReport(userId, thirtyDaysAgo, now);
      case 'usage':
        return this.generateUsageReport(userId, thirtyDaysAgo, now);
      default:
        throw new Error('Invalid report type');
    }
  }

  private async generateActivityReport(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const logs = await this.getActivityLogs({
      user_id: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }, 1000);

    const summary = {
      total_actions: logs.length,
      actions_by_type: {},
      daily_activity: {},
      most_active_day: null,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    logs.forEach(log => {
      // Contar por tipo de ação
      summary.actions_by_type[log.action] = (summary.actions_by_type[log.action] || 0) + 1;
      
      // Atividade diária
      const day = log.timestamp.split('T')[0];
      summary.daily_activity[day] = (summary.daily_activity[day] || 0) + 1;
    });

    // Encontrar dia mais ativo
    const maxActivity = Math.max(...Object.values(summary.daily_activity) as number[]);
    summary.most_active_day = Object.entries(summary.daily_activity)
      .find(([_, count]) => count === maxActivity)?.[0];

    return summary;
  }

  private async generateAnalysisReport(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const { data: analyses } = await this.supabaseClient
      .from('user_analyses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const summary = {
      total_analyses: analyses?.length || 0,
      average_score: 0,
      score_distribution: { low: 0, medium: 0, high: 0 },
      top_suggestions: {},
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    if (analyses && analyses.length > 0) {
      // Calcular média de score
      const totalScore = analyses.reduce((sum, a) => sum + (a.score || 0), 0);
      summary.average_score = totalScore / analyses.length;

      // Distribuição de scores
      analyses.forEach(analysis => {
        const score = analysis.score || 0;
        if (score <= 4) summary.score_distribution.low++;
        else if (score <= 7) summary.score_distribution.medium++;
        else summary.score_distribution.high++;
      });

      // Top sugestões
      analyses.forEach(analysis => {
        if (analysis.suggestions) {
          analysis.suggestions.forEach((suggestion: string) => {
            summary.top_suggestions[suggestion] = (summary.top_suggestions[suggestion] || 0) + 1;
          });
        }
      });
    }

    return summary;
  }

  private async generateUsageReport(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const { data: subscription } = await this.supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    const analyses = await this.supabaseClient
      .from('user_analyses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return {
      subscription_tier: subscription?.subscription_tier || 'free',
      analyses_count: analyses.data?.length || 0,
      subscription_status: subscription?.subscribed ? 'active' : 'inactive',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
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
    const auditService = new AuditService(supabaseClient);

    switch (action) {
      case 'log':
        await auditService.logActivity(payload as AuditLogEntry);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_logs':
        const logs = await auditService.getActivityLogs(payload.filters, payload.limit);
        return new Response(JSON.stringify({ logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_report':
        const report = await auditService.generateReport(
          payload.userId, 
          payload.reportType
        );
        return new Response(JSON.stringify({ report }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in audit-logs function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});