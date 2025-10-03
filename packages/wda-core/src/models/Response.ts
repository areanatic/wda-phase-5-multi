/**
 * Response Entity - Represents a user's answer to a question
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 182-225)
 * @task T004
 */

/**
 * Response entity representing a user's answer
 */
export interface Response {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * Reference to parent Session ID
   */
  sessionId: string;

  /**
   * Reference to Question ID from question pack
   */
  questionId: string;

  /**
   * User's answer (raw text or structured data)
   */
  answer: string | number | boolean | string[];

  /**
   * ISO 8601 timestamp of when answer was given
   */
  answeredAt: string;

  /**
   * Time taken to answer in milliseconds
   * @example 15000 (15 seconds)
   */
  timeSpent: number;

  /**
   * Validation status
   * @default true
   */
  isValid: boolean;

  /**
   * Validation errors (if any)
   */
  validationErrors: string[];

  /**
   * Whether this triggered a follow-up question
   * @default false
   */
  triggeredFollowUp: boolean;

  /**
   * Metadata for analytics
   */
  metadata: {
    /**
     * Question pack this response belongs to
     */
    packId?: string;
    /**
     * Detected sentiment (if applicable)
     */
    sentiment?: 'positive' | 'neutral' | 'negative';
    /**
     * Whether this triggered Freier Talk mode
     */
    triggeredFreierTalk?: boolean;
  };
}

/**
 * Validation rules for Response entity
 */
export const ResponseValidation = {
  validate(response: Partial<Response>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!response.id || response.id.trim() === '') {
      errors.push('Response.id is required');
    }

    // Session ID validation
    if (!response.sessionId || response.sessionId.trim() === '') {
      errors.push('Response.sessionId is required');
    }

    // Question ID validation
    if (!response.questionId || response.questionId.trim() === '') {
      errors.push('Response.questionId is required');
    }

    // Answer validation
    if (response.answer === undefined || response.answer === null) {
      errors.push('Response.answer is required');
    }

    // Time spent validation
    if (response.timeSpent !== undefined && response.timeSpent < 0) {
      errors.push('Response.timeSpent must be >= 0');
    }

    // Validation errors array
    if (response.validationErrors && !Array.isArray(response.validationErrors)) {
      errors.push('Response.validationErrors must be an array');
    }

    return errors;
  },
};

/**
 * Factory function to create a new Response
 */
export function createResponse(params: {
  sessionId: string;
  questionId: string;
  answer: string | number | boolean | string[];
  timeSpent: number;
  packId?: string;
}): Response {
  return {
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    questionId: params.questionId,
    answer: params.answer,
    answeredAt: new Date().toISOString(),
    timeSpent: params.timeSpent,
    isValid: true,
    validationErrors: [],
    triggeredFollowUp: false,
    metadata: {
      packId: params.packId,
    },
  };
}
