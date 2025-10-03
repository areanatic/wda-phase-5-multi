/**
 * Contract Test - POST /session/{sessionId}/resume
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T017)
 * @see ../../../../specs/001-phase-5-multi/contracts/core-api.yaml (lines 104-139)
 * @task T017
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject, createTestSession } from '../helpers/test-data';
import { SESSION_ID_REGEX, TEST_WORKSPACE } from '../setup';

describe('POST /session/{sessionId}/resume', () => {
  let sessionAPI: SessionAPI;
  let testProjectId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
  });

  it('should resume paused session', async () => {
    // Create and pause a session
    const createdSession = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.pauseSession(createdSession.id);

    // Resume session
    const response = await sessionAPI.resumeSession(createdSession.id);

    expect(response.session.id).toBe(createdSession.id);
    expect(response.session.status).toBe('in_progress');
    expect(response.aiSummary).toBeTruthy();
    expect(typeof response.aiSummary).toBe('string');
  });

  it('should generate AI summary with positive tone', async () => {
    // Create, answer some questions, then pause
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    // Mock: Answer a few questions
    // (will be implemented in actual engine)

    await sessionAPI.pauseSession(session.id);

    // Resume
    const response = await sessionAPI.resumeSession(session.id);

    // AI Summary should be encouraging
    expect(response.aiSummary).toMatch(/(Hey|Hallo|Schön|willkommen|zurück)/i);
    expect(response.aiSummary.length).toBeGreaterThan(20);
  });

  it('should fail with 404 for non-existent sessionId', async () => {
    const nonExistentId = 'session-' + crypto.randomUUID();

    await expect(sessionAPI.resumeSession(nonExistentId)).rejects.toThrow(
      'Session not found'
    );
  });

  it('should fail with invalid sessionId format', async () => {
    await expect(sessionAPI.resumeSession('invalid-id')).rejects.toThrow(
      'Invalid sessionId format'
    );
  });

  it('should update session status from paused to in_progress', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.pauseSession(session.id);

    const beforeResume = await sessionAPI.getSession(session.id);
    expect(beforeResume.status).toBe('paused');

    const response = await sessionAPI.resumeSession(session.id);
    expect(response.session.status).toBe('in_progress');
  });

  it('should preserve session data when resuming', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      name: 'Test Resume Session',
      mode: 'deep',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-3-7-sonnet',
      },
    });

    await sessionAPI.pauseSession(session.id);

    const response = await sessionAPI.resumeSession(session.id);

    expect(response.session.name).toBe('Test Resume Session');
    expect(response.session.mode).toBe('deep');
    expect(response.session.projectId).toBe(testProjectId);
  });

  it('should include progress information in resumed session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.pauseSession(session.id);

    const response = await sessionAPI.resumeSession(session.id);

    expect(response.session).toHaveProperty('currentQuestionIndex');
    expect(response.session).toHaveProperty('totalQuestions');
    expect(response.session).toHaveProperty('progress');
    expect(response.session.progress).toBeGreaterThanOrEqual(0);
    expect(response.session.progress).toBeLessThanOrEqual(100);
  });
});
