import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationData {
  userId: string;
  type: 'analysis_complete' | 'template_created' | 'system_update' | 'subscription_changed';
  title: string;
  message: string;
  metadata?: any;
}

class NotificationService {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Salvar notificação no banco
      const { error } = await this.supabaseClient
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving notification:', error);
        return;
      }

      // Buscar configurações de notificação do usuário
      const { data: profile } = await this.supabaseClient
        .from('profiles')
        .select('push_notifications, email_notifications')
        .eq('id', data.userId)
        .single();

      // Enviar push notification se habilitado
      if (profile?.push_notifications) {
        await this.sendPushNotification(data);
      }

      // Enviar email se habilitado
      if (profile?.email_notifications) {
        await this.sendEmailNotification(data);
      }

    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  }

  private async sendPushNotification(data: NotificationData): Promise<void> {
    // Implementar push notification (WebPush, FCM, etc.)
    console.log('Push notification sent:', data.title);
  }

  private async sendEmailNotification(data: NotificationData): Promise<void> {
    // Implementar email notification (SendGrid, Resend, etc.)
    console.log('Email notification sent:', data.title);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.supabaseClient
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  async getUserNotifications(userId: string, limit: number = 10): Promise<any[]> {
    const { data } = await this.supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
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
    const notificationService = new NotificationService(supabaseClient);

    switch (action) {
      case 'send':
        await notificationService.sendNotification(payload as NotificationData);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'mark_read':
        await notificationService.markAsRead(payload.notificationId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_notifications':
        const notifications = await notificationService.getUserNotifications(
          payload.userId, 
          payload.limit
        );
        return new Response(JSON.stringify({ notifications }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in notifications function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});