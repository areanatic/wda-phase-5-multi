/**
 * Contract Test - POST /conversation/next-question
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T020)
 * @see ../../../../specs/001-phase-5-multi/contracts/core-api.yaml (lines 189-238)
 * @task T020
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE, UUID_REGEX } from '../setup';

describe('POST /conversation/next-question', () => {
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let testProjectId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
  });

  it('should return next question for new session', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await conversationAPI.getNextQuestion(session.id);

    expect(response.question).toBeDefined();
    expect(response.question.id).toMatch(/^question-/);
    expect(response.question.text).toBeDefined();
    expect(response.question.type).toMatch(/^(text|number|single_choice|multiple_choice|scale)$/);

    expect(response.progress).toBeDefined();
    expect(response.progress.current).toBe(0);
    expect(response.progress.total).toBeGreaterThan(0);
    expect(response.progress.percentComplete).toBe(0);

    expect(response.aiMessage).toBeDefined();
    expect(typeof response.aiMessage).toBe('string');
    expect(response.aiMessage.length).toBeGreaterThan(0);
  });

  it('should return conversational AI message', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await conversationAPI.getNextQuestion(session.id);

    // AI message should be conversational (not just the question text)
    expect(response.aiMessage).not.toBe(response.question.text.de);
    expect(response.aiMessage).not.toBe(response.question.text.en);
    expect(response.aiMessage.length).toBeGreaterThan(20);
  });

  it('should calculate progress correctly', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await conversationAPI.getNextQuestion(session.id);

    expect(response.progress.current).toBeGreaterThanOrEqual(0);
    expect(response.progress.total).toBeGreaterThan(0);
    expect(response.progress.percentComplete).toBeGreaterThanOrEqual(0);
    expect(response.progress.percentComplete).toBeLessThanOrEqual(100);

    // Percent should match calculation
    const expectedPercent = Math.round(
      (response.progress.current / response.progress.total) * 100
    );
    expect(response.progress.percentComplete).toBe(expectedPercent);
  });

  it('should return 204 when no more questions (survey complete)', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    // Answer all questions (mock implementation)
    let response = await conversationAPI.getNextQuestion(session.id);
    while (response !== null) {
      // Submit answer (mock)
      await conversationAPI.submitAnswer(session.id, {
        questionId: response.question.id,
        answer: 'Test answer',
      });

      // Try to get next question
      try {
        response = await conversationAPI.getNextQuestion(session.id);
      } catch (error: any) {
        if (error.message.includes('No more questions')) {
          response = null;
        } else {
          throw error;
        }
      }
    }

    // Should throw or return null when complete
    await expect(conversationAPI.getNextQuestion(session.id)).rejects.toThrow(
      'No more questions'
    );
  });

  it('should adapt questions based on survey mode', async () => {
    const quickSession = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    const deepSession = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'deep',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(quickSession.id);
    await sessionAPI.startSession(deepSession.id);

    const quickResponse = await conversationAPI.getNextQuestion(quickSession.id);
    const deepResponse = await conversationAPI.getNextQuestion(deepSession.id);

    // Quick mode should have fewer total questions
    expect(quickResponse.progress.total).toBeLessThan(deepResponse.progress.total);
  });

  it('should fail with invalid sessionId', async () => {
    const invalidId = 'session-' + crypto.randomUUID();

    await expect(conversationAPI.getNextQuestion(invalidId)).rejects.toThrow(
      'Session not found'
    );
  });

  it('should fail with paused session', async () => {
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

    await expect(conversationAPI.getNextQuestion(session.id)).rejects.toThrow(
      'Session is paused'
    );
  });

  it('should include question metadata', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'standard',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await conversationAPI.getNextQuestion(session.id);

    expect(response.question.metadata).toBeDefined();
    expect(response.question.applicableModes).toBeDefined();
    expect(response.question.applicableModes).toContain('standard');
  });

  it('should validate question type', async () => {
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);

    const response = await conversationAPI.getNextQuestion(session.id);

    const validTypes = ['text', 'number', 'single_choice', 'multiple_choice', 'scale'];
    expect(validTypes).toContain(response.question.type);
  });
});
