import { supabase } from "@/integrations/supabase/client";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  specialty?: string;
  message: string;
  status: 'read' | 'unread';
  created_at: string;
  updated_at: string;
}

export const messagesApi = {
  async list(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ContactMessage[];
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) throw error;
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread');

    if (error) throw error;
    return count || 0;
  },

  subscribeToMessages(callback: (message: ContactMessage) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          callback(payload.new as ContactMessage);
        }
      )
      .subscribe();
  },

  subscribeToUpdates(callback: (message: ContactMessage) => void) {
    return supabase
      .channel('message-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          callback(payload.new as ContactMessage);
        }
      )
      .subscribe();
  }
};