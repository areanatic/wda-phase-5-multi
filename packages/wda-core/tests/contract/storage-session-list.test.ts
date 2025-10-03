/**
 * Contract Test - GET /storage/session/list
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T024)
 * @task T024
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StorageAPI } from '@/engine/StorageAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('GET /storage/session/list', () => {
  let storageAPI: StorageAPI;
  let sessionAPI: SessionAPI;
  let testProjectId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    storageAPI = new StorageAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
  });

  it('should list all sessions for project', async () => {
    // Create multiple sessions
    const session1 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const session2 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: { provider: 'openai', modelName: 'gpt-4o-mini' },
    });

    const response = await storageAPI.listSessions(testProjectId);

    expect(response.sessions).toBeDefined();
    expect(Array.isArray(response.sessions)).toBe(true);
    expect(response.sessions.length).toBe(2);

    const sessionIds = response.sessions.map((s) => s.id);
    expect(sessionIds).toContain(session1.id);
    expect(sessionIds).toContain(session2.id);
  });

  it('should return empty array for project with no sessions', async () => {
    const response = await storageAPI.listSessions(testProjectId);

    expect(response.sessions).toEqual([]);
  });

  it('should filter sessions by status', async () => {
    const session1 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const session2 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    await sessionAPI.startSession(session1.id);
    await sessionAPI.pauseSession(session1.id);

    const response = await storageAPI.listSessions(testProjectId, {
      status: 'paused',
    });

    expect(response.sessions.length).toBe(1);
    expect(response.sessions[0].status).toBe('paused');
  });

  it('should sort sessions by creation date (newest first)', async () => {
    const session1 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const session2 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const response = await storageAPI.listSessions(testProjectId);

    expect(response.sessions[0].id).toBe(session2.id);
    expect(response.sessions[1].id).toBe(session1.id);
  });

  it('should include session metadata', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      name: 'Metadata Test Session',
      mode: 'deep',
      modelConfig: { provider: 'anthropic', modelName: 'claude-3-7-sonnet' },
    });

    const response = await storageAPI.listSessions(testProjectId);

    const foundSession = response.sessions.find((s) => s.id === session.id);
    expect(foundSession).toBeDefined();
    expect(foundSession!.name).toBe('Metadata Test Session');
    expect(foundSession!.mode).toBe('deep');
    expect(foundSession!.projectId).toBe(testProjectId);
  });

  it('should include progress information', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const response = await storageAPI.listSessions(testProjectId);

    const foundSession = response.sessions[0];
    expect(foundSession).toHaveProperty('progress');
    expect(foundSession).toHaveProperty('currentQuestionIndex');
    expect(foundSession).toHaveProperty('totalQuestions');
  });

  it('should fail with invalid projectId', async () => {
    const invalidId = 'invalid-project-id';

    await expect(storageAPI.listSessions(invalidId)).rejects.toThrow(
      'Invalid projectId format'
    );
  });

  it('should paginate results', async () => {
    // Create 10 sessions
    for (let i = 0; i < 10; i++) {
      await sessionAPI.createSession({
        projectId: testProjectId,
        mode: 'quick',
        modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
      });
    }

    const response = await storageAPI.listSessions(testProjectId, {
      limit: 5,
      offset: 0,
    });

    expect(response.sessions.length).toBe(5);
    expect(response.total).toBe(10);
    expect(response.hasMore).toBe(true);
  });

  it('should filter by date range', async () => {
    const session1 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const cutoffDate = new Date().toISOString();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const session2 = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const response = await storageAPI.listSessions(testProjectId, {
      createdAfter: cutoffDate,
    });

    expect(response.sessions.length).toBe(1);
    expect(response.sessions[0].id).toBe(session2.id);
  });

  it('should include response count', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    const response = await storageAPI.listSessions(testProjectId);

    expect(response.sessions[0]).toHaveProperty('responseIds');
    expect(Array.isArray(response.sessions[0].responseIds)).toBe(true);
  });
});
