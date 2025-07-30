import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class AdminLogsService {
  private supabaseClient: any;
  private functionName = 'admin-logs';

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  async checkAdminRole(authHeader: string): Promise<{ user: any; isAdmin: boolean }> {
    const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser(authHeader);
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role
    const { data: roles } = await this.supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some((r: any) => r.role === 'admin') || false;

    return { user, isAdmin };
  }

  async getErrorLogs(params: {
    limit?: number;
    offset?: number;
    level?: string;
    function_name?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let query = this.supabaseClient
      .from('infra.error_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (params.level) {
      query = query.eq('error_level', params.level);
    }

    if (params.function_name) {
      query = query.eq('function_name', params.function_name);
    }

    if (params.start_date) {
      query = query.gte('timestamp', params.start_date);
    }

    if (params.end_date) {
      query = query.lte('timestamp', params.end_date);
    }

    if (params.offset) {
      query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
    } else {
      query = query.limit(params.limit || 50);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch error logs: ${error.message}`);
    }

    return data;
  }

  async getLogStatistics(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabaseClient
      .from('infra.error_logs')
      .select('error_level, function_name, timestamp')
      .gte('timestamp', startDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch log statistics: ${error.message}`);
    }

    // Aggregate statistics
    const stats = {
      total_logs: data?.length || 0,
      by_level: {} as Record<string, number>,
      by_function: {} as Record<string, number>,
      by_day: {} as Record<string, number>,
      error_rate_trend: [] as Array<{ date: string; count: number }>
    };

    data?.forEach((log: any) => {
      // By level
      stats.by_level[log.error_level] = (stats.by_level[log.error_level] || 0) + 1;
      
      // By function
      stats.by_function[log.function_name] = (stats.by_function[log.function_name] || 0) + 1;
      
      // By day
      const day = log.timestamp.split('T')[0];
      stats.by_day[day] = (stats.by_day[day] || 0) + 1;
    });

    // Create trend data
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      stats.error_rate_trend.push({
        date: dateStr,
        count: stats.by_day[dateStr] || 0
      });
    }

    return stats;
  }

  async getLogflareLogs(params: {
    limit?: number;
    start_time?: string;
    end_time?: string;
  }) {
    const logflareUrl = Deno.env.get('LOG_SINK_URL');
    
    if (!logflareUrl) {
      throw new Error('Logflare not configured');
    }

    try {
      // Parse Logflare URL to extract source ID and API key
      const url = new URL(logflareUrl);
      const sourceId = url.pathname.split('/').pop();
      const apiKey = url.searchParams.get('api_key') || Deno.env.get('LOGFLARE_API_KEY');

      if (!sourceId || !apiKey) {
        throw new Error('Invalid Logflare configuration');
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        limit: String(params.limit || 100),
        ...(params.start_time && { start_time: params.start_time }),
        ...(params.end_time && { end_time: params.end_time }),
      });

      const response = await fetch(
        `https://api.logflare.app/logs/${sourceId}?${queryParams}`,
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Logflare API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch Logflare logs: ${(error as Error).message}`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'logs';
    
    logger.info('Admin logs endpoint called', {
      function_name: 'admin-logs',
      request_id: requestId,
      action,
      method: req.method
    });

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const adminService = new AdminLogsService();
    const { user, isAdmin } = await adminService.checkAdminRole(authHeader);

    if (!isAdmin) {
      logger.warn('Unauthorized admin logs access attempt', {
        function_name: 'admin-logs',
        request_id: requestId,
        user_id: user.id
      });
      
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'logs': {
        const params = {
          limit: parseInt(url.searchParams.get('limit') || '50'),
          offset: parseInt(url.searchParams.get('offset') || '0'),
          level: url.searchParams.get('level') || undefined,
          function_name: url.searchParams.get('function') || undefined,
          start_date: url.searchParams.get('start_date') || undefined,
          end_date: url.searchParams.get('end_date') || undefined,
        };

        const logs = await adminService.getErrorLogs(params);
        
        return new Response(JSON.stringify({ logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stats': {
        const days = parseInt(url.searchParams.get('days') || '7');
        const stats = await adminService.getLogStatistics(days);
        
        return new Response(JSON.stringify({ stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'logflare': {
        const params = {
          limit: parseInt(url.searchParams.get('limit') || '100'),
          start_time: url.searchParams.get('start_time') || undefined,
          end_time: url.searchParams.get('end_time') || undefined,
        };

        const logflareLogs = await adminService.getLogflareLogs(params);
        
        return new Response(JSON.stringify({ logs: logflareLogs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    logger.error('Admin logs endpoint failed', {
      function_name: 'admin-logs',
      request_id: requestId
    }, error as Error);

    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});