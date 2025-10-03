/**
 * AnthropicProvider - Anthropic Claude integration
 */

import { AIProvider, AIMessage, AIResponse, AIProviderConfig } from '../AIProvider';

/**
 * AnthropicProvider - Claude API
 */
export class AnthropicProvider extends AIProvider {
  private baseURL = 'https://api.anthropic.com/v1';

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.modelName,
        system: systemMessage,
        messages: chatMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return {
      content: data.content[0].text,
      tokenCount: data.usage.input_tokens + data.usage.output_tokens,
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
    return 'anthropic';
  }
}
