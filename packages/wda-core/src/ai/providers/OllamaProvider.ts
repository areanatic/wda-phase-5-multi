/**
 * OllamaProvider - Local Ollama integration
 */

import { AIProvider, AIMessage, AIResponse, AIProviderConfig } from '../AIProvider';

/**
 * OllamaProvider - Local Ollama API
 */
export class OllamaProvider extends AIProvider {
  private baseURL: string;

  constructor(config: AIProviderConfig & { baseURL?: string }) {
    super(config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 1000,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return {
      content: data.message.content,
      tokenCount: data.eval_count || 0,
      model: data.model,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'ollama';
  }
}
