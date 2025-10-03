/**
 * Contract Test - POST /session/create
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T016)
 * @see ../../../../specs/001-phase-5-multi/contracts/core-api.yaml (lines 29-102)
 * @task T016
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { UUID_REGEX, SESSION_ID_REGEX, TEST_WORKSPACE } from '../setup';
import type { Session } from '@/models/Session';

describe('POST /session/create', () => {
  let sessionAPI: SessionAPI;
  let testProjectId: string;

  beforeEach(async () => {
    // Create test project
    const project = createTestProject();
    testProjectId = project.id;

    // Initialize SessionAPI
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
  });

  it('should create session with valid input', async () => {
    const response = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1000,
      },
    });

    // Validate response structure
    expect(response.id).toMatch(SESSION_ID_REGEX);
    expect(response.projectId).toBe(testProjectId);
    expect(response.status).toBe('not_started');
    expect(response.mode).toBe('quick');
    expect(response.currentQuestionIndex).toBe(0);
    expect(response.totalQuestions).toBeGreaterThan(0);
    expect(response.progress).toBe(0);
    expect(response.responseIds).toEqual([]);
    expect(response.freierTalkIds).toEqual([]);

    // Validate timestamps
    expect(response.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    expect(response.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.completedAt).toBeNull();
  });

  it('should create session with custom name', async () => {
    const response = await sessionAPI.createSession({
      projectId: testProjectId,
      name: 'Custom Session Name',
      mode: 'standard',
      modelConfig: {
        provider: 'openai',
        modelName: 'gpt-4o-mini',
      },
    });

    expect(response.name).toBe('Custom Session Name');
  });

  it('should auto-generate name if not provided', async () => {
    const response = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'deep',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-3-7-sonnet',
      },
    });

    expect(response.name).toBeTruthy();
    expect(response.name.length).toBeGreaterThan(0);
  });

  it('should fail with invalid mode', async () => {
    await expect(
      sessionAPI.createSession({
        projectId: testProjectId,
        mode: 'invalid' as any,
        modelConfig: {
          provider: 'google',
          modelName: 'gemini-1.5-flash',
        },
      })
    ).rejects.toThrow('Invalid mode');
  });

  it('should fail with missing required fields', async () => {
    await expect(
      sessionAPI.createSession({
        mode: 'quick',
        modelConfig: {
          provider: 'google',
          modelName: 'gemini-1.5-flash',
        },
      } as any)
    ).rejects.toThrow('projectId is required');
  });

  it('should fail with invalid projectId format', async () => {
    await expect(
      sessionAPI.createSession({
        projectId: 'invalid-uuid',
        mode: 'quick',
        modelConfig: {
          provider: 'google',
          modelName: 'gemini-1.5-flash',
        },
      })
    ).rejects.toThrow('Invalid projectId format');
  });

  it('should validate UUID format in response', async () => {
    const response = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    // Extract UUID from session ID (format: "session-{uuid}")
    const uuid = response.id.substring(8);
    expect(uuid).toMatch(UUID_REGEX);
  });

  it('should persist session to file system', async () => {
    const response = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    // Verify session was written to file system
    const fs = await import('fs/promises');
    const sessionPath = `${TEST_WORKSPACE}/.wda/sessions/${response.id}.json`;
    const fileContent = await fs.readFile(sessionPath, 'utf-8');
    const savedSession: Session = JSON.parse(fileContent);

    expect(savedSession.id).toBe(response.id);
    expect(savedSession.status).toBe('not_started');
  });

  it('should support all valid providers', async () => {
    const providers = ['openai', 'anthropic', 'google', 'ollama'] as const;

    for (const provider of providers) {
      const response = await sessionAPI.createSession({
        projectId: testProjectId,
        mode: 'quick',
        modelConfig: {
          provider,
          modelName: 'test-model',
        },
      });

      expect(response.id).toMatch(SESSION_ID_REGEX);
    }
  });

  it('should validate temperature range', async () => {
    await expect(
      sessionAPI.createSession({
        projectId: testProjectId,
        mode: 'quick',
        modelConfig: {
          provider: 'google',
          modelName: 'gemini-1.5-flash',
          temperature: 1.5, // Invalid: > 1.0
        },
      })
    ).rejects.toThrow('Temperature must be between 0.0 and 1.0');
  });

  it('should validate maxTokens range', async () => {
    await expect(
      sessionAPI.createSession({
        projectId: testProjectId,
        mode: 'quick',
        modelConfig: {
          provider: 'google',
          modelName: 'gemini-1.5-flash',
          maxTokens: 5000, // Invalid: > 4000
        },
      })
    ).rejects.toThrow('maxTokens must be between 100 and 4000');
  });
});
