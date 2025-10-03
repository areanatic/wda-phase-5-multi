/**
 * Question Entity - Represents a single question in a question pack
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 227-290)
 * @task T005
 */

/**
 * Question types
 */
export type QuestionType = 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'scale';

/**
 * Follow-up rule conditions
 */
export type FollowUpCondition = 'answer_too_short' | 'answer_too_vague' | 'contains_keywords' | 'answer_negative';

/**
 * Follow-up rule definition
 */
export interface FollowUpRule {
  /**
   * Condition that triggers this follow-up
   */
  condition: FollowUpCondition;

  /**
   * Parameters for the condition (e.g., keywords for 'contains_keywords')
   */
  params?: Record<string, any>;

  /**
   * Follow-up question text (localized)
   */
  followUpText: {
    de: string;
    en: string;
  };

  /**
   * Maximum number of follow-ups allowed
   * @default 2
   */
  maxFollowUps?: number;
}

/**
 * Question entity
 */
export interface Question {
  /**
   * Unique identifier within question pack
   * @example "role-context-01"
   */
  id: string;

  /**
   * Question text (localized)
   */
  text: {
    de: string;
    en: string;
  };

  /**
   * Question type
   */
  type: QuestionType;

  /**
   * Whether this question is required
   * @default true
   */
  required: boolean;

  /**
   * Options for choice-based questions
   */
  options?: {
    de: string[];
    en: string[];
  };

  /**
   * Scale range for scale questions
   */
  scale?: {
    min: number;
    max: number;
    minLabel?: { de: string; en: string };
    maxLabel?: { de: string; en: string };
  };

  /**
   * Validation rules
   */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };

  /**
   * Follow-up rules
   */
  followUpRules?: FollowUpRule[];

  /**
   * Applicable survey modes
   * @example ["standard", "deep"]
   */
  applicableModes: ('quick' | 'standard' | 'deep')[];

  /**
   * Metadata
   */
  metadata: {
    /**
     * Category or theme of this question
     */
    category?: string;
    /**
     * Tags for filtering/analytics
     */
    tags?: string[];
    /**
     * Whether this question can trigger Freier Talk mode
     */
    freierTalkPotential?: 'low' | 'medium' | 'high';
  };
}

/**
 * Validation rules for Question entity
 */
export const QuestionValidation = {
  validate(question: Partial<Question>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!question.id || question.id.trim() === '') {
      errors.push('Question.id is required');
    }

    // Text validation
    if (!question.text || !question.text.de || !question.text.en) {
      errors.push('Question.text must have both "de" and "en" translations');
    }

    // Type validation
    const validTypes: QuestionType[] = ['text', 'number', 'single_choice', 'multiple_choice', 'scale'];
    if (question.type && !validTypes.includes(question.type)) {
      errors.push(`Question.type must be one of: ${validTypes.join(', ')}`);
    }

    // Options validation for choice questions
    if (question.type === 'single_choice' || question.type === 'multiple_choice') {
      if (!question.options || !question.options.de || !question.options.en) {
        errors.push('Question.options must have both "de" and "en" arrays for choice questions');
      }
    }

    // Scale validation
    if (question.type === 'scale') {
      if (!question.scale || question.scale.min === undefined || question.scale.max === undefined) {
        errors.push('Question.scale must have min and max for scale questions');
      }
      if (question.scale && question.scale.min >= question.scale.max) {
        errors.push('Question.scale.min must be less than max');
      }
    }

    // Applicable modes validation
    if (!question.applicableModes || question.applicableModes.length === 0) {
      errors.push('Question.applicableModes must have at least one mode');
    }

    return errors;
  },
};
