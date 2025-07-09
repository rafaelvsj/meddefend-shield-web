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
      const [newUsers, unreadMessages] = await Promise.all([
        // Novos usuários nas últimas 24h
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Mensagens não lidas
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread')
      ]);

      return {
        newUsers24h: newUsers.count || 0,
        iaTokens24h: Math.floor(Math.random() * 50000) + 25000, // Mock data - seria conectado ao sistema de tokens
        churn30d: Math.floor(Math.random() * 15) + 5, // Mock data - seria calculado baseado em cancelamentos
        activeSubs: Math.floor(Math.random() * 500) + 200, // Mock data - seria conectado ao sistema de assinaturas
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