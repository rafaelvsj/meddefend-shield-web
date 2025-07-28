export interface AnalysisResult {
  overall_score: number;
  risk_level: string;
  cfm_compliance: boolean;
  thinking_process: string;
  suggestions: string[];
  improvements: string[];
  context_sources?: string[];
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  supportedFeatures: string[];
}

export interface AIProvider {
  name: string;
  analyze(
    text: string, 
    specialty: string, 
    systemPrompt: string, 
    context?: string
  ): Promise<AnalysisResult>;
  getConfig(): ProviderConfig;
  validateConfig(): boolean;
}

export interface LLMSettings {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_instructions: string;
  specialty_prompts: Record<string, string>;
}

export interface RAGContext {
  content: string;
  source: string;
  similarity_score: number;
}