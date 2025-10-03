/**
 * Checkpoint Entity - Auto-save snapshots for session recovery
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 397-435)
 * @task T008
 */

/**
 * Checkpoint entity for session recovery
 */
export interface Checkpoint {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * Reference to parent Session ID
   */
  sessionId: string;

  /**
   * ISO 8601 timestamp of checkpoint creation
   */
  createdAt: string;

  /**
   * Snapshot of session state at this checkpoint
   */
  sessionSnapshot: {
    /**
     * Current question index
     */
    currentQuestionIndex: number;

    /**
     * Progress percentage
     */
    progress: number;

    /**
     * Number of responses captured so far
     */
    responseCount: number;

    /**
     * Number of Freier Talk entries so far
     */
    freierTalkCount: number;
  };

  /**
   * Reason for checkpoint creation
   */
  reason: 'auto_save' | 'manual_save' | 'pre_crash' | 'session_pause';

  /**
   * File path to full session backup (JSON)
   */
  backupPath: string;

  /**
   * Metadata
   */
  metadata: {
    /**
     * Size of backup file in bytes
     */
    fileSize?: number;
    /**
     * Checksum for integrity validation
     */
    checksum?: string;
  };
}

/**
 * Validation rules for Checkpoint entity
 */
export const CheckpointValidation = {
  validate(checkpoint: Partial<Checkpoint>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!checkpoint.id || checkpoint.id.trim() === '') {
      errors.push('Checkpoint.id is required');
    }

    // Session ID validation
    if (!checkpoint.sessionId || checkpoint.sessionId.trim() === '') {
      errors.push('Checkpoint.sessionId is required');
    }

    // Session snapshot validation
    if (!checkpoint.sessionSnapshot) {
      errors.push('Checkpoint.sessionSnapshot is required');
    } else {
      const snapshot = checkpoint.sessionSnapshot;

      if (snapshot.currentQuestionIndex === undefined || snapshot.currentQuestionIndex < 0) {
        errors.push('Checkpoint.sessionSnapshot.currentQuestionIndex must be >= 0');
      }

      if (snapshot.progress === undefined || snapshot.progress < 0 || snapshot.progress > 100) {
        errors.push('Checkpoint.sessionSnapshot.progress must be between 0 and 100');
      }

      if (snapshot.responseCount === undefined || snapshot.responseCount < 0) {
        errors.push('Checkpoint.sessionSnapshot.responseCount must be >= 0');
      }

      if (snapshot.freierTalkCount === undefined || snapshot.freierTalkCount < 0) {
        errors.push('Checkpoint.sessionSnapshot.freierTalkCount must be >= 0');
      }
    }

    // Reason validation
    const validReasons = ['auto_save', 'manual_save', 'pre_crash', 'session_pause'];
    if (checkpoint.reason && !validReasons.includes(checkpoint.reason)) {
      errors.push(`Checkpoint.reason must be one of: ${validReasons.join(', ')}`);
    }

    // Backup path validation
    if (!checkpoint.backupPath || checkpoint.backupPath.trim() === '') {
      errors.push('Checkpoint.backupPath is required');
    }

    return errors;
  },
};

/**
 * Factory function to create a new Checkpoint
 */
export function createCheckpoint(params: {
  sessionId: string;
  sessionSnapshot: Checkpoint['sessionSnapshot'];
  reason: Checkpoint['reason'];
  backupPath: string;
}): Checkpoint {
  return {
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    createdAt: new Date().toISOString(),
    sessionSnapshot: params.sessionSnapshot,
    reason: params.reason,
    backupPath: params.backupPath,
    metadata: {},
  };
}
