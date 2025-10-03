/**
 * GoogleAIProvider - Google Gemini integration
 */

import { AIProvider, AIMessage, AIResponse, AIProviderConfig } from '../AIProvider';

/**
 * GoogleAIProvider - Gemini API
 */
export class GoogleAIProvider extends AIProvider {
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.config.apiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // Convert messages to Gemini format
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `${this.baseURL}/models/${this.config.modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature || 0.7,
            maxOutputTokens: this.config.maxTokens || 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      tokenCount: data.usageMetadata?.totalTokenCount || 0,
      model: this.config.modelName,
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
    return 'google';
  }
}
