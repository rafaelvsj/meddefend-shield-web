import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Provider interfaces
interface AnalysisResult {
  overall_score: number;
  risk_level: string;
  cfm_compliance: boolean;
  thinking_process: string;
  suggestions: string[];
  improvements: string[];
  context_sources?: string[];
}

interface LLMSettings {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_instructions: string;
  specialty_prompts: Record<string, string>;
}

interface RAGContext {
  content: string;
  source: string;
  similarity_score: number;
}

// Base Provider Class
abstract class BaseProvider {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  abstract analyze(text: string, specialty: string, systemPrompt: string, context?: string): Promise<AnalysisResult>;

  protected buildPrompt(text: string, specialty: string, systemPrompt: string, context?: string): string {
    let prompt = systemPrompt;
    
    if (context) {
      prompt += `\n\nCONTEXTO DA BASE DE CONHECIMENTO:\n${context}`;
    }

    prompt += `\n\nESPECIALIDADE: ${specialty}\n\nTEXTO PARA ANÁLISE:\n${text}`;
    
    return prompt;
  }

  protected parseResponse(response: string): AnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallbackParse(response);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createErrorResponse();
    }
  }

  private fallbackParse(response: string): AnalysisResult {
    return {
      overall_score: 7,
      risk_level: 'Médio',
      cfm_compliance: true,
      thinking_process: response,
      suggestions: ['Revisar análise manual'],
      improvements: ['Melhorar prompt de resposta']
    };
  }

  private createErrorResponse(): AnalysisResult {
    return {
      overall_score: 0,
      risk_level: 'Erro',
      cfm_compliance: false,
      thinking_process: 'Erro no processamento da análise',
      suggestions: ['Tentar novamente'],
      improvements: ['Verificar configuração do provider']
    };
  }
}

// Gemini Provider
class GeminiProvider extends BaseProvider {
  name = 'gemini';

  async analyze(text: string, specialty: string, systemPrompt: string, context?: string): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(text, specialty, systemPrompt, context);
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parseResponse(generatedText);
  }
}

// OpenAI Provider
class OpenAIProvider extends BaseProvider {
  name = 'openai';

  async analyze(text: string, specialty: string, systemPrompt: string, context?: string): Promise<AnalysisResult> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildUserPrompt(text, specialty, context) }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    return this.parseResponse(generatedText);
  }

  private buildUserPrompt(text: string, specialty: string, context?: string): string {
    let userPrompt = `ESPECIALIDADE: ${specialty}\n\nTEXTO PARA ANÁLISE:\n${text}`;
    
    if (context) {
      userPrompt = `CONTEXTO DA BASE DE CONHECIMENTO:\n${context}\n\n${userPrompt}`;
    }
    
    return userPrompt;
  }
}

// AI Manager
class AIManager {
  private providers: Map<string, BaseProvider> = new Map();
  private settings: LLMSettings | null = null;

  setSettings(settings: LLMSettings): void {
    this.settings = settings;
    this.updateProviders();
  }

  private updateProviders(): void {
    if (!this.settings) return;

    const config = {
      model: this.settings.model,
      temperature: this.settings.temperature,
      maxTokens: this.settings.max_tokens,
    };

    this.providers.set('gemini', new GeminiProvider(config));
    this.providers.set('openai', new OpenAIProvider(config));
  }

  async analyze(text: string, specialty: string, context?: string): Promise<AnalysisResult> {
    const provider = this.providers.get(this.settings?.provider || 'gemini');
    if (!provider) {
      throw new Error(`Provider ${this.settings?.provider} not found`);
    }

    const systemPrompt = this.buildSystemPrompt(specialty);
    const result = await provider.analyze(text, specialty, systemPrompt, context);
    
    if (context) {
      result.context_sources = ['Base de Conhecimento'];
    }
    
    return result;
  }

  private buildSystemPrompt(specialty: string): string {
    let prompt = this.settings?.system_instructions || this.getDefaultSystemPrompt();
    
    if (this.settings?.specialty_prompts?.[specialty]) {
      prompt += `\n\n${this.settings.specialty_prompts[specialty]}`;
    }

    return prompt;
  }

  private getDefaultSystemPrompt(): string {
    return `Você é um assistente especializado em análise de medicina defensiva brasileira.
    
Sua tarefa é analisar textos médicos e fornecer feedback sobre práticas de medicina defensiva, compliance com CFM e sugestões de melhoria.

RESPONDA SEMPRE EM JSON VÁLIDO com esta estrutura exata:
{
  "overall_score": number (0-10),
  "risk_level": "Baixo" | "Médio" | "Alto" | "Crítico",
  "cfm_compliance": boolean,
  "thinking_process": "string com sua análise detalhada",
  "suggestions": ["array", "de", "sugestões"],
  "improvements": ["array", "de", "melhorias"]
}

Critérios de análise:
- Documentação adequada
- Consentimento informado
- Protocolos seguidos
- Compliance regulatório
- Gestão de riscos`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { text, specialty, userId, templateId } = await req.json();

    // Carregar configurações LLM
    const { data: llmSettings } = await supabaseClient
      .from('llm_settings')
      .select('*')
      .order('created_at', { ascending: false });

    // Processar configurações em objeto estruturado
    const settings: LLMSettings = {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      max_tokens: 2048,
      system_instructions: '',
      specialty_prompts: {}
    };

    if (llmSettings) {
      for (const setting of llmSettings) {
        switch (setting.setting_key) {
          case 'default_provider':
            settings.provider = setting.setting_value;
            break;
          case 'default_model':
            settings.model = setting.setting_value;
            break;
          case 'temperature':
            settings.temperature = parseFloat(setting.setting_value);
            break;
          case 'max_tokens':
            settings.max_tokens = parseInt(setting.setting_value);
            break;
          case 'system_instructions':
            settings.system_instructions = setting.setting_value;
            break;
          default:
            if (setting.setting_key.startsWith('prompt_')) {
              const specialty = setting.setting_key.replace('prompt_', '');
              settings.specialty_prompts[specialty] = setting.setting_value;
            }
        }
      }
    }

    // Buscar contexto da base de conhecimento (RAG)
    let context = '';
    const { data: knowledgeBase } = await supabaseClient
      .from('knowledge_base')
      .select('content')
      .eq('status', 'processed')
      .limit(3);

    if (knowledgeBase && knowledgeBase.length > 0) {
      context = knowledgeBase.map(kb => kb.content).join('\n\n');
    }

    // Buscar template se especificado
    if (templateId) {
      const { data: template } = await supabaseClient
        .from('document_templates')
        .select('template_content')
        .eq('id', templateId)
        .single();

      if (template?.template_content?.prompt) {
        settings.specialty_prompts[specialty] = template.template_content.prompt;
      }
    }

    // Inicializar AI Manager e executar análise
    const aiManager = new AIManager();
    aiManager.setSettings(settings);
    
    const analysisResult = await aiManager.analyze(text, specialty, context);

    // Salvar resultado no banco
    const { data: analysis } = await supabaseClient
      .from('user_analyses')
      .insert({
        user_id: userId,
        title: `Análise ${specialty}`,
        original_text: text,
        analysis_result: analysisResult,
        score: analysisResult.overall_score,
        suggestions: analysisResult.suggestions,
        improvements: analysisResult.improvements,
        status: 'completed'
      })
      .select()
      .single();

    // Log da atividade
    await supabaseClient
      .from('analysis_history')
      .insert({
        user_id: userId,
        analysis_id: analysis.id,
        action: 'analysis_completed'
      });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-text-v2:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});