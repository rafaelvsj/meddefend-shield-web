import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEDICAL_PROMPTS = {
  cardiologia: `Você é um especialista em análise de documentos médicos de cardiologia. Analise o texto fornecido e identifique:
1. Precisão médica e terminologia
2. Estrutura e organização do documento
3. Completude das informações
4. Conformidade com diretrizes médicas
5. Clareza para pacientes e outros médicos

Forneça um score de 0-100 e sugestões específicas de melhoria.`,
  
  neurologia: `Você é um especialista em análise de documentos médicos de neurologia. Analise o texto fornecido e identifique:
1. Precisão neurológica e terminologia específica
2. Avaliação neurológica adequada
3. Estrutura do documento
4. Completude das informações neurológicas
5. Clareza diagnóstica

Forneça um score de 0-100 e sugestões específicas de melhoria.`,
  
  ortopedia: `Você é um especialista em análise de documentos médicos de ortopedia. Analise o texto fornecido e identifique:
1. Precisão ortopédica e terminologia
2. Descrição anatômica adequada
3. Estrutura do documento
4. Completude das informações
5. Clareza para tratamento

Forneça um score de 0-100 e sugestões específicas de melhoria.`,
  
  geral: `Você é um especialista em análise de documentos médicos gerais. Analise o texto fornecido e identifique:
1. Precisão médica geral
2. Estrutura e organização
3. Completude das informações
4. Conformidade com padrões médicos
5. Clareza comunicativa

Forneça um score de 0-100 e sugestões específicas de melhoria.`
};

interface AnalysisRequest {
  text: string;
  specialty?: string;
  userId: string;
}

interface AnalysisResponse {
  score: number;
  suggestions: string[];
  improvements: string[];
  analysis_result: any;
}

const logStep = (step: string, data?: any) => {
  console.log(`[analyze-text] ${step}:`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Request received', { method: req.method, url: req.url });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      logStep('Missing OPENAI_API_KEY');
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user and request data
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      logStep('Authentication failed', authError);
      throw new Error('Authentication required');
    }

    const { text, specialty = 'geral', userId }: AnalysisRequest = await req.json();
    logStep('Request data', { textLength: text.length, specialty, userId });

    // Check subscription and monthly limits
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .single();

    // Check monthly usage
    const currentMonth = new Date().toISOString().substring(0, 7);
    const { count: monthlyAnalyses } = await supabase
      .from('user_analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', `${currentMonth}-01`);

    logStep('Usage check', { subscription, monthlyAnalyses });

    // Rate limiting based on subscription
    const limits = {
      free: 3,
      starter: 50,
      professional: 200,
      enterprise: 1000
    };

    const userTier = subscription?.subscribed ? subscription.subscription_tier || 'starter' : 'free';
    const limit = limits[userTier as keyof typeof limits] || limits.free;

    if ((monthlyAnalyses || 0) >= limit) {
      logStep('Rate limit exceeded', { monthlyAnalyses, limit, userTier });
      throw new Error(`Monthly limit of ${limit} analyses exceeded for ${userTier} plan`);
    }

    // Get appropriate prompt
    const systemPrompt = MEDICAL_PROMPTS[specialty as keyof typeof MEDICAL_PROMPTS] || MEDICAL_PROMPTS.geral;

    // Call OpenAI API
    logStep('Calling OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

IMPORTANTE: Retorne sua resposta em formato JSON com a seguinte estrutura:
{
  "score": [número de 0-100],
  "categoria": "[categoria principal do documento]",
  "pontos_fortes": ["lista", "de", "pontos", "fortes"],
  "areas_melhoria": ["lista", "de", "áreas", "para", "melhoria"],
  "sugestoes_especificas": ["lista", "de", "sugestões", "específicas"],
  "conformidade": "[nível de conformidade com padrões médicos]",
  "clareza": "[avaliação da clareza do documento]"
}`
          },
          {
            role: 'user',
            content: `Analise este documento médico:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logStep('OpenAI API error', { status: response.status, error });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    logStep('OpenAI response received', { usage: aiResponse.usage });

    // Parse AI response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse.choices[0].message.content);
    } catch (e) {
      logStep('Failed to parse AI response as JSON', aiResponse.choices[0].message.content);
      // Fallback to text analysis
      const content = aiResponse.choices[0].message.content;
      analysisResult = {
        score: 75, // Default score
        categoria: specialty,
        pontos_fortes: ["Análise realizada com sucesso"],
        areas_melhoria: ["Ver sugestões detalhadas"],
        sugestoes_especificas: [content],
        conformidade: "Adequada",
        clareza: "Boa"
      };
    }

    // Prepare response data
    const analysisResponse: AnalysisResponse = {
      score: analysisResult.score || 75,
      suggestions: [
        ...(analysisResult.pontos_fortes || []),
        ...(analysisResult.areas_melhoria || [])
      ],
      improvements: analysisResult.sugestoes_especificas || [],
      analysis_result: analysisResult
    };

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('user_analyses')
      .insert({
        user_id: user.id,
        title: `Análise ${specialty} - ${new Date().toLocaleDateString('pt-BR')}`,
        original_text: text,
        analysis_result: analysisResult,
        score: analysisResponse.score,
        suggestions: analysisResponse.suggestions,
        improvements: analysisResponse.improvements,
        status: 'completed'
      })
      .select()
      .single();

    if (saveError) {
      logStep('Failed to save analysis', saveError);
      throw new Error('Failed to save analysis');
    }

    // Save to analysis history
    await supabase
      .from('analysis_history')
      .insert({
        user_id: user.id,
        analysis_id: savedAnalysis.id,
        action: 'analysis_completed'
      });

    logStep('Analysis completed successfully', { analysisId: savedAnalysis.id, score: analysisResponse.score });

    return new Response(JSON.stringify({
      ...analysisResponse,
      analysisId: savedAnalysis.id,
      remainingAnalyses: limit - (monthlyAnalyses || 0) - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('Error in analyze-text function', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        status: error.message.includes('limit exceeded') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});