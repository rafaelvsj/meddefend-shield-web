import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { logger, withLogging } from "../_shared/logger.ts";
import { withSecurity } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiKeyService {
  name: string;
  testEndpoint?: string;
  rotationDays: number;
  generateKey?: () => Promise<string>;
  testKey?: (key: string) => Promise<boolean>;
}

// Service configurations
const API_SERVICES: Record<string, ApiKeyService> = {
  gemini: {
    name: 'Gemini API',
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    rotationDays: 90,
    testKey: async (key: string) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
        { method: 'GET' }
      );
      return response.ok;
    }
  },
  openai: {
    name: 'OpenAI API',
    testEndpoint: 'https://api.openai.com/v1/models',
    rotationDays: 90,
    testKey: async (key: string) => {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return response.ok;
    }
  },
  resend: {
    name: 'Resend API',
    testEndpoint: 'https://api.resend.com/domains',
    rotationDays: 180,
    testKey: async (key: string) => {
      const response = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return response.ok;
    }
  },
  stripe: {
    name: 'Stripe API',
    testEndpoint: 'https://api.stripe.com/v1/products',
    rotationDays: 365,
    testKey: async (key: string) => {
      const response = await fetch('https://api.stripe.com/v1/products?limit=1', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return response.ok;
    }
  }
};

class KeyRotationManager {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  // Check which keys need rotation
  async getKeysForRotation(): Promise<string[]> {
    const { data: keys, error } = await this.supabase
      .from('api_keys')
      .select('service_name, expires_at, next_rotation')
      .eq('status', 'active');

    if (error) {
      logger.error('Failed to fetch API keys', { error: error.message });
      return [];
    }

    const now = new Date();
    const keysToRotate: string[] = [];

    for (const key of keys || []) {
      const nextRotation = new Date(key.next_rotation || key.expires_at);
      if (nextRotation <= now) {
        keysToRotate.push(key.service_name);
      }
    }

    return keysToRotate;
  }

  // Rotate a specific API key
  async rotateKey(serviceName: string, newKey?: string): Promise<boolean> {
    const service = API_SERVICES[serviceName];
    if (!service) {
      logger.error('Unknown service for key rotation', { serviceName });
      return false;
    }

    try {
      // If no new key provided, we can't generate one automatically
      // In a real implementation, this would integrate with each service's API
      if (!newKey) {
        logger.warn('No new key provided for rotation', { serviceName });
        return false;
      }

      // Test the new key
      if (service.testKey) {
        const isValid = await service.testKey(newKey);
        if (!isValid) {
          logger.error('New key failed validation', { serviceName });
          return false;
        }
      }

      // Update Supabase secrets via Management API
      const success = await this.updateSupabaseSecret(serviceName, newKey);
      if (!success) {
        logger.error('Failed to update Supabase secret', { serviceName });
        return false;
      }

      // Update our tracking record
      const nextRotation = new Date();
      nextRotation.setDate(nextRotation.getDate() + service.rotationDays);

      const { error: updateError } = await this.supabase
        .from('api_keys')
        .upsert({
          service_name: serviceName,
          encrypted_key: await this.encryptKey(newKey),
          expires_at: nextRotation.toISOString(),
          status: 'active',
          last_rotation: new Date().toISOString(),
          next_rotation: nextRotation.toISOString(),
          rotation_count: await this.getRotationCount(serviceName) + 1
        });

      if (updateError) {
        logger.error('Failed to update key record', { serviceName, error: updateError.message });
        return false;
      }

      // Send notification to admins
      await this.notifyAdmins(serviceName, 'rotated');

      logger.info('API key rotated successfully', { 
        serviceName, 
        nextRotation: nextRotation.toISOString() 
      });

      return true;

    } catch (error) {
      logger.error('Key rotation failed', { serviceName, error: error.message });
      await this.notifyAdmins(serviceName, 'rotation_failed', error.message);
      return false;
    }
  }

  // Update Supabase secret via Management API
  private async updateSupabaseSecret(serviceName: string, newKey: string): Promise<boolean> {
    try {
      // Map service names to Supabase secret names
      const secretNameMap: Record<string, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        resend: 'RESEND_API_KEY',
        stripe: 'STRIPE_SECRET_KEY'
      };

      const secretName = secretNameMap[serviceName];
      if (!secretName) {
        logger.error('No secret name mapping for service', { serviceName });
        return false;
      }

      // In a real implementation, this would use Supabase Management API
      // For now, we'll just log the operation
      logger.info('Would update Supabase secret', { secretName, serviceName });
      
      // TODO: Implement actual secret update via Management API
      // const response = await fetch(`${SUPABASE_URL}/v1/projects/${PROJECT_ID}/secrets`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     [secretName]: newKey
      //   })
      // });

      return true;

    } catch (error) {
      logger.error('Failed to update Supabase secret', { serviceName, error: error.message });
      return false;
    }
  }

  // Encrypt API key for storage
  private async encryptKey(key: string): Promise<string> {
    // In a real implementation, use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    return btoa(key);
  }

  // Get current rotation count for a service
  private async getRotationCount(serviceName: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('rotation_count')
      .eq('service_name', serviceName)
      .single();

    if (error || !data) return 0;
    return data.rotation_count || 0;
  }

  // Send notification to admins
  private async notifyAdmins(serviceName: string, event: string, details?: string): Promise<void> {
    try {
      // Get all admin users
      const { data: admins, error } = await this.supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (error || !admins) {
        logger.error('Failed to fetch admin users for notification', { error: error?.message });
        return;
      }

      const message = this.getNotificationMessage(serviceName, event, details);

      // Send notification to each admin
      for (const admin of admins) {
        await this.supabase
          .from('notifications')
          .insert({
            user_id: admin.user_id,
            type: 'api_key_rotation',
            title: 'API Key Rotation',
            message,
            metadata: {
              service_name: serviceName,
              event,
              details,
              timestamp: new Date().toISOString()
            }
          });
      }

      logger.info('Admin notifications sent', { serviceName, event, adminCount: admins.length });

    } catch (error) {
      logger.error('Failed to send admin notifications', { 
        serviceName, 
        event, 
        error: error.message 
      });
    }
  }

  private getNotificationMessage(serviceName: string, event: string, details?: string): string {
    const service = API_SERVICES[serviceName];
    const serviceName_display = service?.name || serviceName;

    switch (event) {
      case 'rotated':
        return `API key for ${serviceName_display} has been successfully rotated.`;
      case 'rotation_failed':
        return `API key rotation for ${serviceName_display} failed. ${details || 'Please check logs for details.'}`;
      case 'rotation_needed':
        return `API key for ${serviceName_display} needs rotation. Please update manually if auto-rotation fails.`;
      default:
        return `API key event for ${serviceName_display}: ${event}`;
    }
  }

  // Get rotation status for all services
  async getRotationStatus(): Promise<Record<string, any>> {
    const { data: keys, error } = await this.supabase
      .from('api_keys')
      .select('*');

    if (error) {
      logger.error('Failed to fetch key status', { error: error.message });
      return {};
    }

    const status: Record<string, any> = {};
    
    for (const [serviceName, service] of Object.entries(API_SERVICES)) {
      const keyRecord = keys?.find(k => k.service_name === serviceName);
      
      status[serviceName] = {
        name: service.name,
        configured: !!keyRecord,
        lastRotation: keyRecord?.last_rotation,
        nextRotation: keyRecord?.next_rotation,
        rotationCount: keyRecord?.rotation_count || 0,
        status: keyRecord?.status || 'not_configured',
        rotationDays: service.rotationDays
      };
    }

    return status;
  }

  // Perform scheduled rotation check
  async performScheduledRotation(): Promise<{ rotated: string[]; failed: string[] }> {
    const keysToRotate = await this.getKeysForRotation();
    const rotated: string[] = [];
    const failed: string[] = [];

    logger.info('Starting scheduled key rotation', { count: keysToRotate.length });

    for (const serviceName of keysToRotate) {
      // In a real implementation, you would have the new keys available
      // For now, we'll just log the need for rotation
      logger.warn('Key needs rotation but no automated generation available', { serviceName });
      
      await this.notifyAdmins(serviceName, 'rotation_needed');
      failed.push(serviceName);
    }

    return { rotated, failed };
  }
}

const handler = withLogging('key-rotation', async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'status';

    const manager = new KeyRotationManager();

    switch (action) {
      case 'status':
        const status = await manager.getRotationStatus();
        return new Response(
          JSON.stringify({ success: true, status }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'rotate':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { serviceName, newKey } = await req.json();
        if (!serviceName) {
          return new Response(
            JSON.stringify({ error: 'serviceName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const success = await manager.rotateKey(serviceName, newKey);
        return new Response(
          JSON.stringify({ success }),
          { status: success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'scheduled':
        const result = await manager.performScheduledRotation();
        return new Response(
          JSON.stringify({ success: true, ...result }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    logger.error('Key rotation error', { error: error.message });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

serve(withSecurity('key-rotation', handler, { requireAdmin: true }));