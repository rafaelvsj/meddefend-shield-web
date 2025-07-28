import { AIProvider, AnalysisResult, ProviderConfig } from '../types';

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract analyze(
    text: string,
    specialty: string,
    systemPrompt: string,
    context?: string
  ): Promise<AnalysisResult>;

  getConfig(): ProviderConfig {
    return this.config;
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

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
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback para resposta estruturada manual
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