import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { logger, withLogging } from "../_shared/logger.ts";
import { withSecurity } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId?: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

class NotificationManager {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async sendNotification(notification: NotificationRequest): Promise<string> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to send notification', { error: error.message });
      throw new Error(`Failed to send notification: ${error.message}`);
    }

    logger.info('Notification sent', { id: data.id, type: notification.type });
    return data.id;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data || [];
  }
}

const handler = withLogging('notifications', async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();
    const manager = new NotificationManager();

    switch (action) {
      case 'send':
        const id = await manager.sendNotification(payload as NotificationRequest);
        return new Response(JSON.stringify({ success: true, id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'mark_read':
        await manager.markAsRead(payload.notificationId, payload.userId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_notifications':
        const notifications = await manager.getUserNotifications(payload.userId, payload.limit);
        return new Response(JSON.stringify({ notifications }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    logger.error('Notifications error', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

serve(withSecurity('notifications', handler));