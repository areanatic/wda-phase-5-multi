/**
 * CopilotProvider - GitHub Copilot integration
 *
 * Note: Uses GitHub Copilot's chat API (available in VS Code extension)
 * This is a placeholder - actual integration depends on VS Code extension context
 */

import { AIProvider, AIMessage, AIResponse, AIProviderConfig } from '../AIProvider';

/**
 * CopilotProvider - GitHub Copilot API
 * This provider works through VS Code's Copilot extension
 */
export class CopilotProvider extends AIProvider {
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // In actual implementation, this would use VS Code's Copilot API
    // For now, throw an error indicating it needs VS Code context
    throw new Error(
      'CopilotProvider requires VS Code extension context. Use from VS Code extension only.'
    );
  }

  async testConnection(): Promise<boolean> {
    // Check if running in VS Code context
    return typeof (global as any).vscode !== 'undefined';
  }

  getProviderName(): string {
    return 'copilot';
  }
}
