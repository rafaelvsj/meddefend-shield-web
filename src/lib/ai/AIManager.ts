import { AIProvider, LLMSettings, AnalysisResult } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';

export class AIManager {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = 'gemini';
  private settings: LLMSettings | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Providers são inicializados quando necessário com as configurações atuais
  }

  setSettings(settings: LLMSettings): void {
    this.settings = settings;
    this.currentProvider = settings.provider;
    this.updateProviders();
  }

  private updateProviders(): void {
    if (!this.settings) return;

    // Configurar Gemini Provider
    if (this.settings.provider === 'gemini') {
      const geminiProvider = new GeminiProvider({
        name: 'gemini',
        apiKey: '', // Será definido na edge function
        model: this.settings.model,
        temperature: this.settings.temperature,
        maxTokens: this.settings.max_tokens,
        supportedFeatures: ['text-analysis', 'embeddings']
      });
      this.providers.set('gemini', geminiProvider);
    }

    // Configurar OpenAI Provider
    if (this.settings.provider === 'openai') {
      const openaiProvider = new OpenAIProvider({
        name: 'openai',
        apiKey: '', // Será definido na edge function
        model: this.settings.model,
        temperature: this.settings.temperature,
        maxTokens: this.settings.max_tokens,
        supportedFeatures: ['text-analysis', 'embeddings', 'chat']
      });
      this.providers.set('openai', openaiProvider);
    }
  }

  getCurrentProvider(): AIProvider | null {
    return this.providers.get(this.currentProvider) || null;
  }

  async analyze(
    text: string,
    specialty: string,
    context?: string
  ): Promise<AnalysisResult> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }

    const systemPrompt = this.buildSystemPrompt(specialty);
    return provider.analyze(text, specialty, systemPrompt, context);
  }

  private buildSystemPrompt(specialty: string): string {
    let prompt = this.settings?.system_instructions || this.getDefaultSystemPrompt();
    
    // Adicionar prompt específico da especialidade se disponível
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

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  switchProvider(providerName: string): boolean {
    if (this.providers.has(providerName)) {
      this.currentProvider = providerName;
      return true;
    }
    return false;
  }
}