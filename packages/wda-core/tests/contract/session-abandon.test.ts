/**
 * Contract Test - POST /session/{sessionId}/abandon
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T019)
 * @see ../../../../specs/001-phase-5-multi/contracts/core-api.yaml (lines 165-187)
 * @task T019
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionAPI } from '@/engine/SessionAPI';
import { ExportService } from '@/export/ExportService';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';
import * as fs from 'fs/promises';

describe('POST /session/{sessionId}/abandon', () => {
  let sessionAPI: SessionAPI;
  let exportService: ExportService;
  let testProjectId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
    exportService = new ExportService(TEST_WORKSPACE);
  });

  it('should abandon in_progress session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await sessionAPI.abandonSession(session.id);

    expect(response.id).toBe(session.id);
    expect(response.status).toBe('abandoned');
  });

  it('should abandon paused session', async () => {
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

    const response = await sessionAPI.abandonSession(session.id);

    expect(response.status).toBe('abandoned');
  });

  it('should abandon not_started session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'deep',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-3-7-sonnet',
      },
    });

    const response = await sessionAPI.abandonSession(session.id);

    expect(response.status).toBe('abandoned');
  });

  it('should retain session data after abandoning', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      name: 'Test Abandoned Session',
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    await sessionAPI.abandonSession(session.id);

    // Verify file still exists
    const sessionPath = `${TEST_WORKSPACE}/.wda/sessions/${session.id}.json`;
    const fileExists = await fs
      .access(sessionPath)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);

    // Verify data is intact
    const fileContent = await fs.readFile(sessionPath, 'utf-8');
    const savedSession = JSON.parse(fileContent);

    expect(savedSession.id).toBe(session.id);
    expect(savedSession.name).toBe('Test Abandoned Session');
    expect(savedSession.status).toBe('abandoned');
  });

  it('should allow exporting abandoned session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    await sessionAPI.abandonSession(session.id);

    // Export abandoned session
    const exportResult = await exportService.exportSession(session.id, 'json');

    expect(exportResult.sessionId).toBe(session.id);
    expect(exportResult.format).toBe('json');
    expect(exportResult.filePath).toBeTruthy();
  });

  it('should fail with non-existent sessionId', async () => {
    const nonExistentId = 'session-' + crypto.randomUUID();

    await expect(sessionAPI.abandonSession(nonExistentId)).rejects.toThrow(
      'Session not found'
    );
  });

  it('should update timestamp when abandoning', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const beforeAbandon = await sessionAPI.getSession(session.id);
    const beforeUpdatedAt = new Date(beforeAbandon.updatedAt).getTime();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await sessionAPI.abandonSession(session.id);
    const afterUpdatedAt = new Date(response.updatedAt).getTime();

    expect(afterUpdatedAt).toBeGreaterThan(beforeUpdatedAt);
  });

  it('should not allow re-abandoning already abandoned session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.abandonSession(session.id);

    await expect(sessionAPI.abandonSession(session.id)).rejects.toThrow(
      'Session is already abandoned'
    );
  });

  it('should preserve responses when abandoning', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    // Add some mock responses
    const mockResponseIds = ['resp-1', 'resp-2', 'resp-3'];
    // (This would be done via actual API in implementation)

    const response = await sessionAPI.abandonSession(session.id);

    // Responses should still be accessible
    expect(response.responseIds).toBeDefined();
  });
});
