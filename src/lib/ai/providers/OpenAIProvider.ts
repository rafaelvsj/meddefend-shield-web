import { BaseProvider } from './BaseProvider';
import { AnalysisResult, ProviderConfig } from '../types';

export class OpenAIProvider extends BaseProvider {
  name = 'openai';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async analyze(
    text: string,
    specialty: string,
    systemPrompt: string,
    context?: string
  ): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(text, specialty, systemPrompt, context);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
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