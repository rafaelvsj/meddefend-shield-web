import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class AdminKbLogsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async checkAdminRole(authHeader: string): Promise<{ user: any; isAdmin: boolean }> {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await this.supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { data: roleData, error: roleError } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const isAdmin = !roleError && roleData;
    
    return { user, isAdmin };
  }

  async getKnowledgeBaseLogs(limit = 50) {
    const { data: logs, error } = await this.supabase
      .from('knowledge_base')
      .select(`
        id,
        file_name,
        original_name,
        file_type,
        status,
        file_size,
        created_at,
        processed_at,
        created_by,
        profiles:created_by(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch knowledge base logs: ${error.message}`);
    }

    return logs || [];
  }

  async getKnowledgeBaseStats() {
    const { data: totalFiles, error: totalError } = await this.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    const { data: processedFiles, error: processedError } = await this.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processed');

    const { data: pendingFiles, error: pendingError } = await this.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: errorFiles, error: errorErrorQuery } = await this.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    if (totalError || processedError || pendingError || errorErrorQuery) {
      throw new Error('Failed to fetch knowledge base statistics');
    }

    return {
      totalFiles: totalFiles?.length || 0,
      processedFiles: processedFiles?.length || 0,
      pendingFiles: pendingFiles?.length || 0,
      errorFiles: errorFiles?.length || 0,
      successRate: totalFiles?.length ? `${Math.round((processedFiles?.length || 0) / totalFiles.length * 100)}%` : '0%'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'logs';
    
    const authHeader = req.headers.get('authorization');
    console.log(`🔍 [admin-kb-logs] Processing ${req.method} request for action: ${action}`);

    const service = new AdminKbLogsService();
    const { user, isAdmin } = await service.checkAdminRole(authHeader || '');
    
    if (!isAdmin) {
      console.log(`❌ [admin-kb-logs] Access denied for user: ${user?.id}`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ [admin-kb-logs] Admin access confirmed for user: ${user.id}`);

    let result;
    
    switch (action) {
      case 'stats':
        result = await service.getKnowledgeBaseStats();
        break;
      case 'logs':
      default:
        result = await service.getKnowledgeBaseLogs();
        break;
    }

    console.log(`📊 [admin-kb-logs] Returning ${action} data:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [admin-kb-logs] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});