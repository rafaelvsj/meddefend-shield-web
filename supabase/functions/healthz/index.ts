import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  latency_ms?: number;
  error?: string;
  details?: any;
}

class HealthChecker {
  private supabaseClient: any;
  private functionName = 'healthz';

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('count')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          latency_ms: latency,
          error: error.message
        };
      }

      return {
        service: 'database',
        status: 'healthy',
        latency_ms: latency
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  async checkGeminiAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiKey) {
      return {
        service: 'gemini_api',
        status: 'unhealthy',
        error: 'GEMINI_API_KEY not configured'
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          service: 'gemini_api',
          status: 'unhealthy',
          latency_ms: latency,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        service: 'gemini_api',
        status: 'healthy',
        latency_ms: latency
      };
    } catch (error) {
      return {
        service: 'gemini_api',
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  async checkJobQueue(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check pending documents in knowledge base
      const { data, error } = await this.supabaseClient
        .from('knowledge_base')
        .select('id, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'job_queue',
          status: 'unhealthy',
          latency_ms: latency,
          error: error.message
        };
      }

      // Check for stuck jobs (pending for more than 10 minutes)
      const stuckJobs = data?.filter(job => {
        const jobAge = Date.now() - new Date(job.created_at).getTime();
        return jobAge > 10 * 60 * 1000; // 10 minutes
      }) || [];

      return {
        service: 'job_queue',
        status: stuckJobs.length > 0 ? 'unhealthy' : 'healthy',
        latency_ms: latency,
        details: {
          pending_jobs: data?.length || 0,
          stuck_jobs: stuckJobs.length
        }
      };
    } catch (error) {
      return {
        service: 'job_queue',
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  async checkErrorLogs(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check recent error logs (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabaseClient
        .from('infra.error_logs')
        .select('error_level')
        .gte('timestamp', fiveMinutesAgo)
        .in('error_level', ['error', 'fatal']);

      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'error_monitoring',
          status: 'unhealthy',
          latency_ms: latency,
          error: error.message
        };
      }

      const errorCount = data?.length || 0;
      const fatalCount = data?.filter(log => log.error_level === 'fatal').length || 0;

      return {
        service: 'error_monitoring',
        status: fatalCount > 0 ? 'unhealthy' : 'healthy',
        latency_ms: latency,
        details: {
          recent_errors: errorCount,
          recent_fatals: fatalCount
        }
      };
    } catch (error) {
      return {
        service: 'error_monitoring',
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: HealthCheckResult[];
    summary: {
      total_checks: number;
      healthy: number;
      unhealthy: number;
      average_latency_ms: number;
    };
  }> {
    const requestId = crypto.randomUUID();
    
    logger.info('Health check started', {
      function_name: this.functionName,
      request_id: requestId
    });

    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkGeminiAPI(),
      this.checkJobQueue(),
      this.checkErrorLogs()
    ]);

    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const avgLatency = checks
      .filter(c => c.latency_ms)
      .reduce((sum, c) => sum + (c.latency_ms || 0), 0) / checks.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyCount <= 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const result = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total_checks: checks.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        average_latency_ms: Math.round(avgLatency)
      }
    };

    logger.info('Health check completed', {
      function_name: this.functionName,
      request_id: requestId,
      status: overallStatus,
      healthy_count: healthyCount,
      unhealthy_count: unhealthyCount
    });

    return result;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    logger.info('Health check endpoint called', {
      function_name: 'healthz',
      request_id: requestId,
      method: req.method,
      url: req.url
    });

    const healthChecker = new HealthChecker();
    const healthResult = await healthChecker.performHealthCheck();

    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(healthResult), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Health check failed', {
      function_name: 'healthz',
      request_id: requestId
    }, error as Error);

    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});