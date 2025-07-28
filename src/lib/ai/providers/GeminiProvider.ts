import { BaseProvider } from './BaseProvider';
import { AnalysisResult, ProviderConfig } from '../types';

export class GeminiProvider extends BaseProvider {
  name = 'gemini';

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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + this.config.apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
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