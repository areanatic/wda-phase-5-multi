/**
 * QuestionPack Entity - Collection of related questions
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 292-345)
 * @task T006
 */

import type { Question } from './Question';

/**
 * QuestionPack entity
 */
export interface QuestionPack {
  /**
   * Unique identifier
   * @example "role-context"
   */
  id: string;

  /**
   * Display name (localized)
   */
  name: {
    de: string;
    en: string;
  };

  /**
   * Description (localized)
   */
  description: {
    de: string;
    en: string;
  };

  /**
   * Version (semantic versioning)
   * @example "1.0.0"
   */
  version: string;

  /**
   * Author information
   */
  author: {
    name: string;
    email?: string;
  };

  /**
   * ISO 8601 timestamp of creation
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last update
   */
  updatedAt: string;

  /**
   * Questions in this pack
   */
  questions: Question[];

  /**
   * Metadata
   */
  metadata: {
    /**
     * Category or theme
     */
    category?: string;
    /**
     * Tags for filtering
     */
    tags?: string[];
    /**
     * Estimated completion time in minutes
     */
    estimatedMinutes?: number;
    /**
     * Target audience
     */
    targetAudience?: string[];
  };
}

/**
 * Validation rules for QuestionPack entity
 */
export const QuestionPackValidation = {
  validate(pack: Partial<QuestionPack>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!pack.id || pack.id.trim() === '') {
      errors.push('QuestionPack.id is required');
    }

    // Name validation
    if (!pack.name || !pack.name.de || !pack.name.en) {
      errors.push('QuestionPack.name must have both "de" and "en" translations');
    }

    // Description validation
    if (!pack.description || !pack.description.de || !pack.description.en) {
      errors.push('QuestionPack.description must have both "de" and "en" translations');
    }

    // Version validation (semantic versioning)
    if (pack.version && !QuestionPackValidation.isValidSemver(pack.version)) {
      errors.push('QuestionPack.version must follow semantic versioning (e.g., "1.0.0")');
    }

    // Author validation
    if (!pack.author || !pack.author.name) {
      errors.push('QuestionPack.author.name is required');
    }

    // Questions validation
    if (!pack.questions || !Array.isArray(pack.questions)) {
      errors.push('QuestionPack.questions must be an array');
    } else if (pack.questions.length === 0) {
      errors.push('QuestionPack.questions must have at least one question');
    }

    return errors;
  },

  /**
   * Validates semantic versioning format
   */
  isValidSemver(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  },
};

/**
 * Factory function to create a new QuestionPack
 */
export function createQuestionPack(params: {
  id: string;
  name: { de: string; en: string };
  description: { de: string; en: string };
  author: { name: string; email?: string };
  questions: Question[];
  version?: string;
}): QuestionPack {
  const now = new Date().toISOString();

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    version: params.version || '1.0.0',
    author: params.author,
    createdAt: now,
    updatedAt: now,
    questions: params.questions,
    metadata: {},
  };
}
