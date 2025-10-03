/**
 * FreierTalkEntry Entity - Represents unstructured insights from Freier Talk mode
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 347-395)
 * @task T007
 */

/**
 * Freier Talk trigger source
 */
export type FreierTalkTrigger = 'user_initiated' | 'ai_detected_frustration' | 'follow_up_digression' | 'end_of_survey';

/**
 * FreierTalkEntry entity
 */
export interface FreierTalkEntry {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * Reference to parent Session ID
   */
  sessionId: string;

  /**
   * Reference to Question ID that triggered this (if applicable)
   */
  triggeredByQuestionId?: string;

  /**
   * How this Freier Talk was triggered
   */
  trigger: FreierTalkTrigger;

  /**
   * Conversation transcript (user + AI messages)
   */
  transcript: {
    role: 'user' | 'ai';
    message: string;
    timestamp: string;
  }[];

  /**
   * ISO 8601 timestamp of when this started
   */
  startedAt: string;

  /**
   * ISO 8601 timestamp of when this ended
   */
  endedAt: string | null;

  /**
   * Total duration in milliseconds
   */
  duration: number;

  /**
   * AI-extracted key insights
   */
  keyInsights: string[];

  /**
   * AI-detected tags/themes
   */
  tags: string[];

  /**
   * Detected sentiment
   */
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';

  /**
   * Metadata
   */
  metadata: {
    /**
     * Token count for this conversation
     */
    tokenCount?: number;
    /**
     * Whether user explicitly ended this
     */
    userEnded?: boolean;
  };
}

/**
 * Validation rules for FreierTalkEntry entity
 */
export const FreierTalkEntryValidation = {
  validate(entry: Partial<FreierTalkEntry>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!entry.id || entry.id.trim() === '') {
      errors.push('FreierTalkEntry.id is required');
    }

    // Session ID validation
    if (!entry.sessionId || entry.sessionId.trim() === '') {
      errors.push('FreierTalkEntry.sessionId is required');
    }

    // Trigger validation
    const validTriggers: FreierTalkTrigger[] = [
      'user_initiated',
      'ai_detected_frustration',
      'follow_up_digression',
      'end_of_survey',
    ];
    if (entry.trigger && !validTriggers.includes(entry.trigger)) {
      errors.push(`FreierTalkEntry.trigger must be one of: ${validTriggers.join(', ')}`);
    }

    // Transcript validation
    if (!entry.transcript || !Array.isArray(entry.transcript)) {
      errors.push('FreierTalkEntry.transcript must be an array');
    } else {
      entry.transcript.forEach((msg, idx) => {
        if (!msg.role || !['user', 'ai'].includes(msg.role)) {
          errors.push(`FreierTalkEntry.transcript[${idx}].role must be "user" or "ai"`);
        }
        if (!msg.message || msg.message.trim() === '') {
          errors.push(`FreierTalkEntry.transcript[${idx}].message is required`);
        }
      });
    }

    // Sentiment validation
    const validSentiments = ['positive', 'neutral', 'negative', 'mixed'];
    if (entry.sentiment && !validSentiments.includes(entry.sentiment)) {
      errors.push(`FreierTalkEntry.sentiment must be one of: ${validSentiments.join(', ')}`);
    }

    // Arrays validation
    if (entry.keyInsights && !Array.isArray(entry.keyInsights)) {
      errors.push('FreierTalkEntry.keyInsights must be an array');
    }

    if (entry.tags && !Array.isArray(entry.tags)) {
      errors.push('FreierTalkEntry.tags must be an array');
    }

    return errors;
  },
};

/**
 * Factory function to create a new FreierTalkEntry
 */
export function createFreierTalkEntry(params: {
  sessionId: string;
  trigger: FreierTalkTrigger;
  triggeredByQuestionId?: string;
}): FreierTalkEntry {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    triggeredByQuestionId: params.triggeredByQuestionId,
    trigger: params.trigger,
    transcript: [],
    startedAt: now,
    endedAt: null,
    duration: 0,
    keyInsights: [],
    tags: [],
    sentiment: 'neutral',
    metadata: {},
  };
}
