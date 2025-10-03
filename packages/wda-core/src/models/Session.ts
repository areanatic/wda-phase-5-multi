/**
 * Session Entity - Represents a single survey session
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 117-180)
 * @task T003
 */

import type { SurveyMode } from './Config';

// Re-export SurveyMode for convenience
export type { SurveyMode };

/**
 * Session status
 */
export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned';

/**
 * Session entity representing a survey session
 */
export interface Session {
  /**
   * Unique identifier (UUID v4)
   * @example "session-550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Reference to parent Project ID
   */
  projectId: string;

  /**
   * User-friendly session name
   * @example "Backend API Workflow - 2025-10-03"
   */
  name: string;

  /**
   * Survey mode used for this session
   */
  mode: SurveyMode;

  /**
   * Current session status
   * @default 'in_progress'
   */
  status: SessionStatus;

  /**
   * ISO 8601 timestamp of session start
   */
  startedAt: string;

  /**
   * ISO 8601 timestamp of session completion (null if not completed)
   */
  completedAt: string | null;

  /**
   * ISO 8601 timestamp of last update
   */
  updatedAt: string;

  /**
   * IDs of selected question packs for this session
   * @example ["role-context", "development-workflow", "tools-environment"]
   */
  selectedPackIds: string[];

  /**
   * Current question index (0-based)
   * @default 0
   */
  currentQuestionIndex: number;

  /**
   * Total number of questions in this session
   */
  totalQuestions: number;

  /**
   * Progress percentage (0-100)
   * @example 45.5
   */
  progress: number;

  /**
   * References to Response IDs
   */
  responseIds: string[];

  /**
   * References to FreierTalkEntry IDs
   */
  freierTalkIds: string[];

  /**
   * Metadata for additional context
   */
  metadata: {
    /**
     * Detected or user-provided project context
     */
    projectContext?: {
      language?: string;
      framework?: string;
      teamSize?: number;
    };
    /**
     * Session-specific notes
     */
    notes?: string;
    /**
     * Number of exports created for this session
     */
    exportCount?: number;
  };
}

/**
 * Validation rules for Session entity
 */
export const SessionValidation = {
  validate(session: Partial<Session>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!session.id || !session.id.startsWith('session-')) {
      errors.push('Session.id must start with "session-"');
    }

    // Project ID reference
    if (!session.projectId || session.projectId.trim() === '') {
      errors.push('Session.projectId is required');
    }

    // Name validation
    if (!session.name || session.name.trim() === '') {
      errors.push('Session.name is required');
    }

    // Mode validation
    const validModes: SurveyMode[] = ['quick', 'standard', 'deep'];
    if (session.mode && !validModes.includes(session.mode)) {
      errors.push(`Session.mode must be one of: ${validModes.join(', ')}`);
    }

    // Status validation
    const validStatuses: SessionStatus[] = ['in_progress', 'completed', 'paused', 'abandoned'];
    if (session.status && !validStatuses.includes(session.status)) {
      errors.push(`Session.status must be one of: ${validStatuses.join(', ')}`);
    }

    // Progress validation
    if (session.progress !== undefined && (session.progress < 0 || session.progress > 100)) {
      errors.push('Session.progress must be between 0 and 100');
    }

    // Question index validation
    if (session.currentQuestionIndex !== undefined && session.currentQuestionIndex < 0) {
      errors.push('Session.currentQuestionIndex must be >= 0');
    }

    // Arrays validation
    if (session.selectedPackIds && !Array.isArray(session.selectedPackIds)) {
      errors.push('Session.selectedPackIds must be an array');
    }

    if (session.responseIds && !Array.isArray(session.responseIds)) {
      errors.push('Session.responseIds must be an array');
    }

    if (session.freierTalkIds && !Array.isArray(session.freierTalkIds)) {
      errors.push('Session.freierTalkIds must be an array');
    }

    return errors;
  },
};

/**
 * Factory function to create a new Session
 */
export function createSession(params: {
  projectId: string;
  name: string;
  mode: SurveyMode;
  selectedPackIds: string[];
  totalQuestions?: number;
}): Session {
  const now = new Date().toISOString();

  return {
    id: `session-${crypto.randomUUID()}`,
    projectId: params.projectId,
    name: params.name,
    mode: params.mode,
    status: 'not_started',
    startedAt: now,
    completedAt: null,
    updatedAt: now,
    selectedPackIds: params.selectedPackIds,
    currentQuestionIndex: 0,
    totalQuestions: params.totalQuestions || 10, // Default 10 questions
    progress: 0,
    responseIds: [],
    freierTalkIds: [],
    metadata: {},
  };
}
