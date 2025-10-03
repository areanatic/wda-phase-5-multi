/**
 * Contract Test - POST /conversation/freier-talk/start
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T022)
 * @task T022
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE, UUID_REGEX } from '../setup';

describe('POST /conversation/freier-talk/start', () => {
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let testProjectId: string;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      mode: 'quick',
      modelConfig: {
        provider: 'google',
        modelName: 'gemini-1.5-flash',
      },
    });

    await sessionAPI.startSession(session.id);
    sessionId = session.id;
  });

  it('should start freier talk from user initiation', async () => {
    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'I want to discuss something else',
    });

    expect(response.freierTalkId).toMatch(UUID_REGEX);
    expect(response.status).toBe('active');
    expect(response.aiResponse).toBeDefined();
    expect(typeof response.aiResponse).toBe('string');
  });

  it('should start freier talk from AI frustration detection', async () => {
    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'ai_detected_frustration',
      triggeredByQuestionId: 'question-123',
    });

    expect(response.freierTalkId).toMatch(UUID_REGEX);
    expect(response.status).toBe('active');
  });

  it('should start freier talk from follow-up digression', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'follow_up_digression',
      triggeredByQuestionId: questionResponse.question.id,
      initialMessage: 'This reminds me of another issue...',
    });

    expect(response.freierTalkId).toMatch(UUID_REGEX);
  });

  it('should include AI welcoming message', async () => {
    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'I have an idea',
    });

    expect(response.aiResponse).toBeTruthy();
    expect(response.aiResponse.length).toBeGreaterThan(20);
    // Should be encouraging
    expect(response.aiResponse).toMatch(/(gern|super|interessant|erzähl|spannend)/i);
  });

  it('should pause current question flow', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);
    const currentQuestionId = questionResponse.question.id;

    await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Different topic',
    });

    const session = await sessionAPI.getSession(sessionId);
    // Question index should not advance during freier talk
    expect(session.currentQuestionIndex).toBe(questionResponse.progress.current);
  });

  it('should fail with paused session', async () => {
    await sessionAPI.pauseSession(sessionId);

    await expect(
      conversationAPI.startFreierTalk(sessionId, {
        trigger: 'user_initiated',
        initialMessage: 'Test',
      })
    ).rejects.toThrow('Session is paused');
  });

  it('should fail with abandoned session', async () => {
    await sessionAPI.abandonSession(sessionId);

    await expect(
      conversationAPI.startFreierTalk(sessionId, {
        trigger: 'user_initiated',
        initialMessage: 'Test',
      })
    ).rejects.toThrow('Session is abandoned');
  });

  it('should fail with invalid sessionId', async () => {
    const invalidId = 'session-' + crypto.randomUUID();

    await expect(
      conversationAPI.startFreierTalk(invalidId, {
        trigger: 'user_initiated',
        initialMessage: 'Test',
      })
    ).rejects.toThrow('Session not found');
  });

  it('should store freier talk entry with trigger info', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'follow_up_digression',
      triggeredByQuestionId: questionResponse.question.id,
      initialMessage: 'Side topic',
    });

    const session = await sessionAPI.getSession(sessionId);
    expect(session.freierTalkIds).toContain(response.freierTalkId);
  });

  it('should initialize empty transcript array', async () => {
    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Hello',
    });

    const freierTalkEntry = await conversationAPI.getFreierTalkEntry(
      sessionId,
      response.freierTalkId
    );

    expect(freierTalkEntry.transcript).toBeDefined();
    expect(Array.isArray(freierTalkEntry.transcript)).toBe(true);
    expect(freierTalkEntry.transcript.length).toBeGreaterThanOrEqual(1); // At least initial message
  });

  it('should set startedAt timestamp', async () => {
    const beforeStart = new Date().toISOString();

    const response = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Test',
    });

    const freierTalkEntry = await conversationAPI.getFreierTalkEntry(
      sessionId,
      response.freierTalkId
    );

    expect(freierTalkEntry.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(freierTalkEntry.startedAt).toBeGreaterThanOrEqual(beforeStart);
  });

  it('should allow multiple freier talk sessions in one survey session', async () => {
    const response1 = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'First topic',
    });

    await conversationAPI.endFreierTalk(sessionId, response1.freierTalkId);

    const response2 = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Second topic',
    });

    expect(response2.freierTalkId).not.toBe(response1.freierTalkId);

    const session = await sessionAPI.getSession(sessionId);
    expect(session.freierTalkIds.length).toBe(2);
  });
});
