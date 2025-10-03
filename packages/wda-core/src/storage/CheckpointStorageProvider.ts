/**
 * CheckpointStorageProvider - Manages session checkpoint/recovery
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T012)
 * @task T012
 */

import type { Checkpoint } from '../models/Checkpoint';
import type { Session } from '../models/Session';
import { LocalStorageProvider } from './LocalStorageProvider';

/**
 * CheckpointStorageProvider handles session backup and recovery
 */
export class CheckpointStorageProvider {
  constructor(private storage: LocalStorageProvider) {}

  /**
   * Create a checkpoint for a session
   */
  async createCheckpoint(
    session: Session,
    reason: Checkpoint['reason']
  ): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      createdAt: new Date().toISOString(),
      sessionSnapshot: {
        currentQuestionIndex: session.currentQuestionIndex,
        progress: session.progress,
        responseCount: session.responseIds.length,
        freierTalkCount: session.freierTalkIds.length,
      },
      reason,
      backupPath: `checkpoints/${session.id}/${Date.now()}.json`,
      metadata: {},
    };

    // Save full session backup
    await this.storage.writeJSON(checkpoint.backupPath, session);

    // Get backup file size
    const stats = await this.storage.stat(checkpoint.backupPath);
    checkpoint.metadata.fileSize = stats.size;

    // Save checkpoint metadata
    const checkpointPath = `checkpoints/${session.id}/checkpoint-${checkpoint.id}.json`;
    await this.storage.writeJSON(checkpointPath, checkpoint);

    return checkpoint;
  }

  /**
   * Load latest checkpoint for a session
   */
  async loadLatestCheckpoint(sessionId: string): Promise<Checkpoint | null> {
    try {
      const dirPath = `checkpoints/${sessionId}`;
      const files = await this.storage.list(dirPath);

      // Filter checkpoint metadata files
      const checkpointFiles = files
        .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      if (checkpointFiles.length === 0) {
        return null;
      }

      // Load most recent checkpoint
      const latestFile = checkpointFiles[0];
      return await this.storage.readJSON<Checkpoint>(`${dirPath}/${latestFile}`);
    } catch {
      return null;
    }
  }

  /**
   * Restore session from checkpoint
   */
  async restoreSession(checkpoint: Checkpoint): Promise<Session> {
    return await this.storage.readJSON<Session>(checkpoint.backupPath);
  }

  /**
   * List all checkpoints for a session
   */
  async listCheckpoints(sessionId: string): Promise<Checkpoint[]> {
    try {
      const dirPath = `checkpoints/${sessionId}`;
      const files = await this.storage.list(dirPath);

      const checkpoints: Checkpoint[] = [];

      for (const file of files) {
        if (file.startsWith('checkpoint-') && file.endsWith('.json')) {
          const checkpoint = await this.storage.readJSON<Checkpoint>(`${dirPath}/${file}`);
          checkpoints.push(checkpoint);
        }
      }

      // Sort by creation date (most recent first)
      return checkpoints.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Delete old checkpoints (keep only N most recent)
   */
  async cleanupCheckpoints(sessionId: string, keepCount = 5): Promise<void> {
    const checkpoints = await this.listCheckpoints(sessionId);

    // Delete old checkpoints (beyond keepCount)
    const toDelete = checkpoints.slice(keepCount);

    for (const checkpoint of toDelete) {
      // Delete backup file
      await this.storage.delete(checkpoint.backupPath);

      // Delete checkpoint metadata
      const checkpointPath = `checkpoints/${sessionId}/checkpoint-${checkpoint.id}.json`;
      await this.storage.delete(checkpointPath);
    }
  }

  /**
   * Check if session has checkpoints
   */
  async hasCheckpoints(sessionId: string): Promise<boolean> {
    const latest = await this.loadLatestCheckpoint(sessionId);
    return latest !== null;
  }
}
