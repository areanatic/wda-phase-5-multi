/**
 * AIProvider - Abstract base class for AI providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokenCount: number;
  model: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Abstract AIProvider base class
 */
export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * Send chat completion request
   */
  abstract chat(messages: AIMessage[]): Promise<AIResponse>;

  /**
   * Test API connectivity
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;
}
