/**
 * AIProviderFactory - Creates AI provider instances
 */

import { AIProvider, AIProviderConfig } from './AIProvider';
import { GoogleAIProvider } from './providers/GoogleAIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { CopilotProvider } from './providers/CopilotProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { AIProvider as AIProviderType } from '../models/Config';

/**
 * Factory to create AI provider instances
 */
export class AIProviderFactory {
  /**
   * Create provider by type
   */
  static createProvider(
    providerType: AIProviderType,
    config: AIProviderConfig
  ): AIProvider {
    switch (providerType) {
      case 'google':
        return new GoogleAIProvider(config);

      case 'openai':
        return new OpenAIProvider(config);

      case 'anthropic':
        return new AnthropicProvider(config);

      case 'copilot':
        return new CopilotProvider(config);

      case 'ollama':
        return new OllamaProvider(config);

      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  /**
   * Get default model for provider
   */
  static getDefaultModel(providerType: AIProviderType): string {
    switch (providerType) {
      case 'google':
        return 'gemini-1.5-flash';

      case 'openai':
        return 'gpt-4o-mini';

      case 'anthropic':
        return 'claude-3-7-sonnet';

      case 'copilot':
        return 'gpt-4';

      case 'ollama':
        return 'llama2';

      default:
        return 'gemini-1.5-flash';
    }
  }
}
