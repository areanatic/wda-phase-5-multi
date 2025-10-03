/**
 * Config Entity - User settings and preferences for WDA in a specific workspace
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 72-115)
 * @task T002
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'copilot' | 'openai' | 'anthropic' | 'google' | 'ollama';

/**
 * Supported languages
 */
export type Language = 'de' | 'en';

/**
 * Survey modes
 */
export type SurveyMode = 'quick' | 'standard' | 'deep';

/**
 * API key configuration for a specific provider
 */
export interface APIKeyConfig {
  provider: AIProvider;
  key: string; // Encrypted in storage
  enabled: boolean;
}

/**
 * Config entity for user settings
 */
export interface Config {
  /**
   * Preferred AI provider
   * @default 'copilot'
   */
  preferredAIProvider: AIProvider;

  /**
   * API keys for different providers (encrypted in storage)
   */
  apiKeys: APIKeyConfig[];

  /**
   * Preferred language
   * @default 'en'
   */
  language: Language;

  /**
   * Default survey mode
   * @default 'standard'
   */
  defaultMode: SurveyMode;

  /**
   * Auto-save enabled
   * @default true
   */
  autoSave: boolean;

  /**
   * Auto-save interval in milliseconds
   * @default 30000 (30 seconds)
   */
  autoSaveInterval: number;

  /**
   * Telemetry enabled (for analytics)
   * @default false
   */
  telemetryEnabled: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Config = {
  preferredAIProvider: 'copilot',
  apiKeys: [],
  language: 'en',
  defaultMode: 'standard',
  autoSave: true,
  autoSaveInterval: 30000,
  telemetryEnabled: false,
};

/**
 * Validation rules for Config entity
 */
export const ConfigValidation = {
  /**
   * Validates a config object
   */
  validate(config: Partial<Config>): string[] {
    const errors: string[] = [];

    // AI Provider validation
    const validProviders: AIProvider[] = ['copilot', 'openai', 'anthropic', 'google', 'ollama'];
    if (config.preferredAIProvider && !validProviders.includes(config.preferredAIProvider)) {
      errors.push(`Config.preferredAIProvider must be one of: ${validProviders.join(', ')}`);
    }

    // Language validation
    const validLanguages: Language[] = ['de', 'en'];
    if (config.language && !validLanguages.includes(config.language)) {
      errors.push(`Config.language must be one of: ${validLanguages.join(', ')}`);
    }

    // Survey mode validation
    const validModes: SurveyMode[] = ['quick', 'standard', 'deep'];
    if (config.defaultMode && !validModes.includes(config.defaultMode)) {
      errors.push(`Config.defaultMode must be one of: ${validModes.join(', ')}`);
    }

    // Auto-save interval validation
    if (config.autoSaveInterval !== undefined && config.autoSaveInterval < 5000) {
      errors.push('Config.autoSaveInterval must be at least 5000ms (5 seconds)');
    }

    // API keys validation
    if (config.apiKeys) {
      config.apiKeys.forEach((keyConfig, index) => {
        if (!validProviders.includes(keyConfig.provider)) {
          errors.push(`Config.apiKeys[${index}].provider must be one of: ${validProviders.join(', ')}`);
        }
        if (!keyConfig.key || keyConfig.key.trim() === '') {
          errors.push(`Config.apiKeys[${index}].key cannot be empty`);
        }
      });
    }

    return errors;
  },
};

/**
 * Factory function to create a new Config with defaults
 */
export function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}
