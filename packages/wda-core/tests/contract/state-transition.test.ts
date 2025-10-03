/**
 * Contract Test - State Transition Validation
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T034)
 * @task T034
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('State Transition Validation', () => {
  let sessionAPI: SessionAPI;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    const session = await sessionAPI.createSession({
      projectId: project.id,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });
    sessionId = session.id;
  });

  it('should allow: not_started → in_progress', async () => {
    await expect(sessionAPI.startSession(sessionId)).resolves.toBeDefined();
  });

  it('should allow: in_progress → paused', async () => {
    await sessionAPI.startSession(sessionId);
    await expect(sessionAPI.pauseSession(sessionId)).resolves.toBeDefined();
  });

  it('should allow: paused → in_progress (resume)', async () => {
    await sessionAPI.startSession(sessionId);
    await sessionAPI.pauseSession(sessionId);
    await expect(sessionAPI.resumeSession(sessionId)).resolves.toBeDefined();
  });

  it('should allow: in_progress → completed', async () => {
    await sessionAPI.startSession(sessionId);
    await expect(sessionAPI.completeSession(sessionId)).resolves.toBeDefined();
  });

  it('should allow: any_state → abandoned', async () => {
    await sessionAPI.startSession(sessionId);
    await expect(sessionAPI.abandonSession(sessionId)).resolves.toBeDefined();
  });

  it('should reject: paused → paused', async () => {
    await sessionAPI.startSession(sessionId);
    await sessionAPI.pauseSession(sessionId);
    await expect(sessionAPI.pauseSession(sessionId)).rejects.toThrow();
  });

  it('should reject: completed → in_progress', async () => {
    await sessionAPI.startSession(sessionId);
    await sessionAPI.completeSession(sessionId);
    await expect(sessionAPI.startSession(sessionId)).rejects.toThrow();
  });

  it('should reject: abandoned → any_state', async () => {
    await sessionAPI.abandonSession(sessionId);
    await expect(sessionAPI.startSession(sessionId)).rejects.toThrow();
  });
});
