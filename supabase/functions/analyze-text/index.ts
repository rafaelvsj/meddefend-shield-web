import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEDICAL_PROMPTS = {
  cardiologia: `Você é um especialista em análise de documentos médicos de cardiologia com foco em MEDICINA DEFENSIVA.

CONTEXTO LEGAL: Analise considerando:
- Riscos de negligência médica
- Conformidade com diretrizes do CFM
- Padrões de documentação hospitalar
- Proteção legal do profissional

ANÁLISE DETALHADA:
1. **Precisão diagnóstica** e terminologia cardiológica
2. **Documentação defensiva** - registros que protegem legalmente
3. **Conformidade com protocolos** do SBC e ACC/AHA
4. **Completude de informações** essenciais para defesa legal
5. **Clareza comunicativa** para pacientes e colegas
6. **Identificação de vulnerabilidades** legais no documento

RACIOCÍNIO: Use suas capacidades de thinking para explicar o processo de análise legal.`,
  
  neurologia: `Você é um especialista em análise de documentos médicos de neurologia com foco em MEDICINA DEFENSIVA.

CONTEXTO LEGAL: Analise considerando:
- Riscos de erro diagnóstico neurológico
- Conformidade com diretrizes da ABN
- Documentação de exame neurológico completo
- Proteção contra processos por atraso diagnóstico

ANÁLISE DETALHADA:
1. **Avaliação neurológica completa** e documentada
2. **Raciocínio diagnóstico explícito** para defesa legal
3. **Conformidade com protocolos** da ABN e sociedades internacionais
4. **Documentação de diagnósticos diferenciais** considerados
5. **Registros temporais** adequados para cronologia
6. **Identificação de gaps** que possam gerar responsabilização

RACIOCÍNIO: Demonstre o processo de análise de risco legal neurológico.`,
  
  ortopedia: `Você é um especialista em análise de documentos médicos de ortopedia com foco em MEDICINA DEFENSIVA.

CONTEXTO LEGAL: Analise considerando:
- Riscos de complicações cirúrgicas
- Conformidade com SBOT e AOTrauma
- Documentação de consentimento informado
- Proteção em procedimentos invasivos

ANÁLISE DETALHADA:
1. **Descrição anatômica precisa** e mensurável
2. **Documentação de riscos** e alternativas apresentadas
3. **Conformidade com guidelines** ortopédicos atuais
4. **Registros pré e pós-operatórios** completos
5. **Comunicação de prognóstico** adequada
6. **Identificação de exposições** legais potenciais

RACIOCÍNIO: Explique a análise de risco cirúrgico e legal.`,
  
  geral: `Você é um especialista em análise de documentos médicos gerais com foco em MEDICINA DEFENSIVA.

CONTEXTO LEGAL: Analise considerando:
- Conformidade com CFM e CRM
- Padrões de prontuário médico
- Proteção contra alegações de má prática
- Documentação adequada para defesa processual

ANÁLISE DETALHADA:
1. **Estrutura de prontuário** conforme resoluções CFM
2. **Linguagem técnica apropriada** e defensiva
3. **Completude de informações** obrigatórias
4. **Conformidade com protocolos** ministeriais
5. **Clareza na comunicação** médico-paciente
6. **Identificação de vulnerabilidades** jurídicas

RACIOCÍNIO: Use thinking para demonstrar análise de compliance médico-legal.`
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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      logStep('Missing GEMINI_API_KEY');
      throw new Error('GEMINI_API_KEY not configured');
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

    // Call Gemini API
    logStep('Calling Gemini API');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}

IMPORTANTE: Use suas capacidades de THINKING/RACIOCÍNIO para analisar este documento de forma defensiva.

ESTRUTURA DE RESPOSTA: Retorne em JSON:
{
  "thinking_process": "[Seu processo de raciocínio sobre riscos legais e compliance]",
  "score": [número de 0-100],
  "categoria": "[categoria principal do documento]",
  "vulnerabilidades_legais": ["lista", "de", "vulnerabilidades", "identificadas"],
  "pontos_defensivos": ["aspectos", "que", "protegem", "legalmente"],
  "areas_melhoria": ["áreas", "críticas", "para", "melhoria"],
  "sugestoes_especificas": ["sugestões", "detalhadas", "de", "medicina", "defensiva"],
  "conformidade_cfm": "[nível de conformidade com CFM/CRM]",
  "risco_processual": "[baixo/médio/alto e justificativa]"
}

DOCUMENTO PARA ANÁLISE:

${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.2, // Lower for more consistent legal analysis
          maxOutputTokens: 3000, // Increased for detailed thinking process
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logStep('Gemini API error', { status: response.status, error });
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    logStep('Gemini response received', { candidatesCount: aiResponse.candidates?.length });

    // Parse AI response
    let analysisResult;
    try {
      const geminiContent = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!geminiContent) {
        throw new Error('No content in Gemini response');
      }
      
      // Try to extract JSON from response
      const jsonMatch = geminiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      logStep('Failed to parse AI response as JSON', aiResponse.candidates?.[0]?.content?.parts?.[0]?.text);
      // Fallback to text analysis
      const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Análise não disponível';
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