import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: Request, params: any) => Promise<Response>;
  requiresAuth?: boolean;
  rateLimit?: string;
}

class APIManager {
  private supabaseClient: any;
  private endpoints: Map<string, APIEndpoint> = new Map();

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.setupEndpoints();
  }

  private setupEndpoints(): void {
    // Endpoint para análises
    this.registerEndpoint({
      path: '/api/v1/analyses',
      method: 'GET',
      handler: this.getAnalyses.bind(this),
      requiresAuth: true,
      rateLimit: 'analyses'
    });

    this.registerEndpoint({
      path: '/api/v1/analyses',
      method: 'POST',
      handler: this.createAnalysis.bind(this),
      requiresAuth: true,
      rateLimit: 'analyses'
    });

    // Endpoint para templates
    this.registerEndpoint({
      path: '/api/v1/templates',
      method: 'GET',
      handler: this.getTemplates.bind(this),
      requiresAuth: true,
      rateLimit: 'templates'
    });

    // Endpoint para base de conhecimento
    this.registerEndpoint({
      path: '/api/v1/knowledge-base/search',
      method: 'POST',
      handler: this.searchKnowledge.bind(this),
      requiresAuth: true,
      rateLimit: 'knowledge_base'
    });

    // Endpoint para webhooks
    this.registerEndpoint({
      path: '/api/v1/webhooks',
      method: 'POST',
      handler: this.registerWebhook.bind(this),
      requiresAuth: true,
      rateLimit: 'webhooks'
    });

    // Endpoint público para webhooks
    this.registerEndpoint({
      path: '/api/v1/webhook/trigger',
      method: 'POST',
      handler: this.triggerWebhook.bind(this),
      requiresAuth: false
    });

    // Endpoint para métricas (apenas admins)
    this.registerEndpoint({
      path: '/api/v1/metrics',
      method: 'GET',
      handler: this.getMetrics.bind(this),
      requiresAuth: true
    });
  }

  private registerEndpoint(endpoint: APIEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE';
    
    const endpointKey = `${method}:${path}`;
    const endpoint = this.endpoints.get(endpointKey);

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Verificar autenticação se necessário
      if (endpoint.requiresAuth) {
        const authResult = await this.checkAuth(req);
        if (!authResult.success) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Verificar rate limit se aplicável
      if (endpoint.rateLimit && endpoint.requiresAuth) {
        const user = await this.getUser(req);
        const rateLimitResult = await this.checkRateLimit(user.id, endpoint.rateLimit);
        
        if (!rateLimitResult.allowed) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded',
            resetTime: rateLimitResult.resetTime
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Executar handler
      const params = this.extractParams(url);
      return await endpoint.handler(req, params);

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async checkAuth(req: Request): Promise<{ success: boolean; user?: any }> {
    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false };
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await this.supabaseClient.auth.getUser(token);
      
      return { success: !error && !!user, user };
    } catch {
      return { success: false };
    }
  }

  private async getUser(req: Request): Promise<any> {
    const authResult = await this.checkAuth(req);
    return authResult.user;
  }

  private async checkRateLimit(userId: string, endpoint: string): Promise<any> {
    // Implementar verificação de rate limit
    // Retorna { allowed: boolean, remaining: number, resetTime: Date }
    return { allowed: true, remaining: 100, resetTime: new Date() };
  }

  private extractParams(url: URL): any {
    const params: any = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }

  // Handlers dos endpoints
  private async getAnalyses(req: Request, params: any): Promise<Response> {
    const user = await this.getUser(req);
    const { data, error } = await this.supabaseClient
      .from('user_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(params.limit || 10);

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async createAnalysis(req: Request, params: any): Promise<Response> {
    const user = await this.getUser(req);
    const body = await req.json();
    
    // Chamar função de análise
    const analysisResponse = await this.supabaseClient.functions.invoke('analyze-text-v2', {
      body: {
        text: body.text,
        specialty: body.specialty,
        userId: user.id,
        templateId: body.templateId
      }
    });

    if (analysisResponse.error) throw new Error(analysisResponse.error);

    return new Response(JSON.stringify({ data: analysisResponse.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async getTemplates(req: Request, params: any): Promise<Response> {
    const { data, error } = await this.supabaseClient
      .from('document_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async searchKnowledge(req: Request, params: any): Promise<Response> {
    const body = await req.json();
    
    const searchResponse = await this.supabaseClient.functions.invoke('search-knowledge', {
      body: { query: body.query, limit: body.limit || 3 }
    });

    if (searchResponse.error) throw new Error(searchResponse.error);

    return new Response(JSON.stringify({ data: searchResponse.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async registerWebhook(req: Request, params: any): Promise<Response> {
    const user = await this.getUser(req);
    const body = await req.json();
    
    const webhookData = {
      ...body,
      created_by: user.id
    };

    const { data, error } = await this.supabaseClient
      .from('webhooks')
      .insert(webhookData)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async triggerWebhook(req: Request, params: any): Promise<Response> {
    const body = await req.json();
    
    // Processar webhook trigger
    console.log('Webhook triggered:', body);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async getMetrics(req: Request, params: any): Promise<Response> {
    const user = await this.getUser(req);
    
    // Verificar se é admin
    const { data: userRole } = await this.supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar métricas do sistema
    const metrics = {
      total_users: 0,
      total_analyses: 0,
      active_subscriptions: 0,
      processing_time_avg: 0
    };

    // Implementar queries de métricas...

    return new Response(JSON.stringify({ data: metrics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

    const apiManager = new APIManager(supabaseClient);
    return await apiManager.handleRequest(req);

  } catch (error) {
    console.error('Error in external-api function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});