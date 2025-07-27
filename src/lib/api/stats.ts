import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  newUsers24h: number;
  iaTokens24h: number;
  churn30d: number;
  activeSubs: number;
  unreadMessages: number;
}

export const statsApi = {
  async getStats(): Promise<AdminStats> {
    try {
      const [newUsers, unreadMessages, analyses, activeSubs] = await Promise.all([
        // Novos usuários nas últimas 24h
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Mensagens não lidas
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread'),

        // Análises realizadas nas últimas 24h (proxy para tokens IA)
        supabase
          .from('user_analyses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Assinantes ativos
        supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true)
      ]);

      // Calcular churn dos últimos 30 dias
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: canceledSubs } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', false)
        .gte('updated_at', thirtyDaysAgo);

      const totalSubs = (activeSubs.count || 0) + (canceledSubs || 0);
      const churnRate = totalSubs > 0 ? Math.round((canceledSubs || 0) / totalSubs * 100) : 0;

      return {
        newUsers24h: newUsers.count || 0,
        iaTokens24h: (analyses.count || 0) * 1000, // Aproximação: cada análise = ~1000 tokens
        churn30d: churnRate,
        activeSubs: activeSubs.count || 0,
        unreadMessages: unreadMessages.count || 0
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return {
        newUsers24h: 0,
        iaTokens24h: 0,
        churn30d: 0,
        activeSubs: 0,
        unreadMessages: 0
      };
    }
  }
};