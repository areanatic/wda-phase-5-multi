/**
 * OpenAIProvider - OpenAI GPT integration
 */

import { AIProvider, AIMessage, AIResponse, AIProviderConfig } from '../AIProvider';

/**
 * OpenAIProvider - OpenAI Chat Completions API
 */
export class OpenAIProvider extends AIProvider {
  private baseURL = 'https://api.openai.com/v1';

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      tokenCount: data.usage.total_tokens,
      model: data.model,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'Hello' }]);
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'openai';
  }
}
