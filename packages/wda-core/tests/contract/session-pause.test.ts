/**
 * Contract Test - POST /session/{sessionId}/pause
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T018)
 * @see ../../../../specs/001-phase-5-multi/contracts/core-api.yaml (lines 141-163)
 * @task T018
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionAPI } from '@/engine/SessionAPI';
import { CheckpointStorageProvider } from '@/storage/CheckpointStorageProvider';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('POST /session/{sessionId}/pause', () => {
  let sessionAPI: SessionAPI;
  let checkpointStorage: CheckpointStorageProvider;
  let testProjectId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
    checkpointStorage = new CheckpointStorageProvider(TEST_WORKSPACE);
  });

  it('should pause in_progress session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    // Start session (move to in_progress)
    await sessionAPI.startSession(session.id);

    // Pause session
    const response = await sessionAPI.pauseSession(session.id);

    expect(response.id).toBe(session.id);
    expect(response.status).toBe('paused');
  });

  it('should create auto checkpoint before pausing', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    await sessionAPI.pauseSession(session.id);

    // Verify checkpoint was created
    const checkpoints = await checkpointStorage.listCheckpoints(session.id);
    expect(checkpoints.length).toBeGreaterThan(0);

    const latestCheckpoint = checkpoints[0];
    expect(latestCheckpoint.reason).toBe('auto_save');
    expect(latestCheckpoint.sessionId).toBe(session.id);
  });

  it('should fail when pausing already-paused session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    await sessionAPI.pauseSession(session.id);

    // Try to pause again
    await expect(sessionAPI.pauseSession(session.id)).rejects.toThrow(
      'Session is already paused'
    );
  });

  it('should fail with non-existent sessionId', async () => {
    const nonExistentId = 'session-' + crypto.randomUUID();

    await expect(sessionAPI.pauseSession(nonExistentId)).rejects.toThrow(
      'Session not found'
    );
  });

  it('should preserve session progress when pausing', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'deep',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-3-7-sonnet',
      },
    });

    await sessionAPI.startSession(session.id);

    const beforePause = await sessionAPI.getSession(session.id);
    const response = await sessionAPI.pauseSession(session.id);

    expect(response.currentQuestionIndex).toBe(beforePause.currentQuestionIndex);
    expect(response.progress).toBe(beforePause.progress);
    expect(response.responseIds).toEqual(beforePause.responseIds);
  });

  it('should update timestamp when pausing', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const beforePause = await sessionAPI.getSession(session.id);
    const beforeUpdatedAt = new Date(beforePause.updatedAt).getTime();

    // Wait a bit to ensure timestamp differs
    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await sessionAPI.pauseSession(session.id);
    const afterUpdatedAt = new Date(response.updatedAt).getTime();

    expect(afterUpdatedAt).toBeGreaterThan(beforeUpdatedAt);
  });

  it('should allow pausing session from not_started status', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    // Pause immediately without starting
    const response = await sessionAPI.pauseSession(session.id);

    expect(response.status).toBe('paused');
  });

  it('should persist paused status to file system', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    await sessionAPI.pauseSession(session.id);

    // Read from file system
    const fs = await import('fs/promises');
    const sessionPath = `${TEST_WORKSPACE}/.wda/sessions/${session.id}.json`;
    const fileContent = await fs.readFile(sessionPath, 'utf-8');
    const savedSession = JSON.parse(fileContent);

    expect(savedSession.status).toBe('paused');
  });
});
