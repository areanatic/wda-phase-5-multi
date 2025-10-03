/**
 * QuestionPackValidator - Validates question pack YAML schemas
 */

import * as yaml from 'js-yaml';
import { QuestionPack } from '../models/QuestionPack';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * QuestionPackValidator
 */
export class QuestionPackValidator {
  /**
   * Validate YAML content
   */
  async validateYAML(yamlContent: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const data = yaml.load(yamlContent) as any;

      // Required fields
      if (!data.id) errors.push('Pack ID is required');
      if (!data.version) errors.push('version is required');
      if (!data.name) errors.push('name is required');

      // Validate pack ID (kebab-case)
      if (data.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.id)) {
        errors.push('Pack ID must be kebab-case');
      }

      // Validate semantic versioning
      if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
        errors.push('Invalid semantic version');
      }

      // Validate bilingual text
      if (data.name && !data.name.en) {
        errors.push('Missing English text');
      }

      // Validate questions
      if (data.questions) {
        for (const q of data.questions) {
          // Question type validation
          const validTypes = ['text', 'number', 'single_choice', 'multiple_choice', 'scale'];
          if (!validTypes.includes(q.type)) {
            errors.push(`Invalid question type: ${q.type}`);
          }

          // Options presence
          if (q.type === 'single_choice' && !q.options) {
            errors.push('single_choice requires options');
          }

          // Scale validation
          if (q.type === 'scale' && q.scale) {
            if (q.scale.min >= q.scale.max) {
              errors.push('Scale min must be less than max');
            }
          }

          // Applicable modes
          if (q.applicableModes) {
            const validModes = ['quick', 'standard', 'deep'];
            for (const mode of q.applicableModes) {
              if (!validModes.includes(mode)) {
                errors.push('Invalid mode');
              }
            }
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      return { valid: false, errors: [`YAML parse error: ${error.message}`] };
    }
  }
}
