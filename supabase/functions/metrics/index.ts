import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { logger, withLogging } from "../_shared/logger.ts";
import { withSecurity } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  help?: string;
  type?: 'counter' | 'gauge' | 'histogram';
}

class MetricsCollector {
  private supabase: any;
  private metrics: Map<string, MetricData> = new Map();

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  // Record a metric value
  async recordMetric(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.supabase
        .from('metrics_snapshots')
        .insert({
          metric_name: name,
          metric_value: value,
          labels
        });
      
      logger.debug('Metric recorded', { name, value, labels });
    } catch (error) {
      logger.error('Failed to record metric', { name, value, labels, error: error.message });
    }
  }

  // Collect system metrics
  async collectSystemMetrics(): Promise<void> {
    const now = new Date();
    
    // HTTP request metrics
    const httpMetrics = await this.getHttpMetrics();
    for (const metric of httpMetrics) {
      this.metrics.set(`http_requests_total_${JSON.stringify(metric.labels)}`, metric);
    }

    // Queue metrics
    const queueMetrics = await this.getQueueMetrics();
    for (const metric of queueMetrics) {
      this.metrics.set(`queue_jobs_${metric.name}`, metric);
    }

    // Cache metrics
    const cacheMetrics = await this.getCacheMetrics();
    for (const metric of cacheMetrics) {
      this.metrics.set(`cache_${metric.name}`, metric);
    }

    // Database metrics
    const dbMetrics = await this.getDatabaseMetrics();
    for (const metric of dbMetrics) {
      this.metrics.set(`database_${metric.name}`, metric);
    }
  }

  private async getHttpMetrics(): Promise<MetricData[]> {
    try {
      // Query audit logs for HTTP request metrics (last 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data: requests, error } = await this.supabase
        .from('audit_logs')
        .select('action, details')
        .eq('resource_type', 'http_request')
        .gte('timestamp', oneHourAgo.toISOString());

      if (error || !requests) return [];

      const metrics: MetricData[] = [];
      const groupedRequests: Record<string, number> = {};

      for (const request of requests) {
        const method = request.details?.method || 'unknown';
        const endpoint = request.details?.endpoint || 'unknown';
        const status = request.details?.status || 'unknown';
        
        const key = `${method}_${endpoint}_${status}`;
        groupedRequests[key] = (groupedRequests[key] || 0) + 1;
      }

      for (const [key, count] of Object.entries(groupedRequests)) {
        const [method, endpoint, status] = key.split('_');
        metrics.push({
          name: 'http_requests_total',
          value: count,
          labels: { method, endpoint, status },
          help: 'Total number of HTTP requests',
          type: 'counter'
        });
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get HTTP metrics', { error: error.message });
      return [];
    }
  }

  private async getQueueMetrics(): Promise<MetricData[]> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('job_queue')
        .select('status, type');

      if (error || !jobs) return [];

      const metrics: MetricData[] = [];
      const statusCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};

      for (const job of jobs) {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        typeCounts[job.type] = (typeCounts[job.type] || 0) + 1;
      }

      // Status metrics
      for (const [status, count] of Object.entries(statusCounts)) {
        metrics.push({
          name: `jobs_${status}`,
          value: count,
          help: `Number of jobs in ${status} status`,
          type: 'gauge'
        });
      }

      // Type metrics
      for (const [type, count] of Object.entries(typeCounts)) {
        metrics.push({
          name: 'jobs_by_type',
          value: count,
          labels: { type },
          help: 'Number of jobs by type',
          type: 'gauge'
        });
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get queue metrics', { error: error.message });
      return [];
    }
  }

  private async getCacheMetrics(): Promise<MetricData[]> {
    try {
      const metrics: MetricData[] = [];

      // Cache entries count
      const { count: totalEntries, error: countError } = await this.supabase
        .from('cache_entries')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        metrics.push({
          name: 'entries_total',
          value: totalEntries || 0,
          help: 'Total number of cache entries',
          type: 'gauge'
        });
      }

      // Cache hit/miss ratio (based on access_count)
      const { data: accessData, error: accessError } = await this.supabase
        .from('cache_entries')
        .select('access_count')
        .gte('last_accessed', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

      if (!accessError && accessData) {
        const totalAccesses = accessData.reduce((sum, entry) => sum + entry.access_count, 0);
        const hitRatio = accessData.length > 0 ? totalAccesses / accessData.length : 0;
        
        metrics.push({
          name: 'hit_ratio',
          value: hitRatio,
          help: 'Cache hit ratio',
          type: 'gauge'
        });
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get cache metrics', { error: error.message });
      return [];
    }
  }

  private async getDatabaseMetrics(): Promise<MetricData[]> {
    try {
      const metrics: MetricData[] = [];

      // User analyses count
      const { count: analysesCount, error: analysesError } = await this.supabase
        .from('user_analyses')
        .select('*', { count: 'exact', head: true });

      if (!analysesError) {
        metrics.push({
          name: 'analyses_total',
          value: analysesCount || 0,
          help: 'Total number of user analyses',
          type: 'gauge'
        });
      }

      // Knowledge base documents count
      const { count: documentsCount, error: documentsError } = await this.supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

      if (!documentsError) {
        metrics.push({
          name: 'knowledge_documents_total',
          value: documentsCount || 0,
          help: 'Total number of knowledge base documents',
          type: 'gauge'
        });
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get database metrics', { error: error.message });
      return [];
    }
  }

  // Export metrics in Prometheus format
  exportPrometheusFormat(): string {
    let output = '';
    
    for (const [key, metric] of this.metrics) {
      // Add help comment
      if (metric.help) {
        output += `# HELP ${metric.name} ${metric.help}\n`;
      }
      
      // Add type comment
      if (metric.type) {
        output += `# TYPE ${metric.name} ${metric.type}\n`;
      }
      
      // Add metric line
      const labelsStr = metric.labels ? 
        `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : 
        '';
      
      output += `${metric.name}${labelsStr} ${metric.value}\n`;
    }
    
    return output;
  }

  // Clear collected metrics
  clear(): void {
    this.metrics.clear();
  }
}

const handler = withLogging('metrics', async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if metrics are enabled
  if (Deno.env.get('METRICS_ENABLED') !== 'true') {
    return new Response(
      'Metrics not enabled',
      { status: 503, headers: corsHeaders }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'export';

    const collector = new MetricsCollector();

    switch (action) {
      case 'export':
        // Collect current metrics
        await collector.collectSystemMetrics();
        
        // Export in Prometheus format
        const metricsText = collector.exportPrometheusFormat();
        
        return new Response(metricsText, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
          }
        });

      case 'record':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for recording metrics' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { name, value, labels = {} } = await req.json();
        
        if (!name || typeof value !== 'number') {
          return new Response(
            JSON.stringify({ error: 'Invalid metric data. Name and numeric value required.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await collector.recordMetric(name, value, labels);
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    logger.error('Metrics error', { error: error.message });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

serve(withSecurity('metrics', handler, { requireAdmin: true }));