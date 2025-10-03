/**
 * Contract Test - POST /conversation/freier-talk/end
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T023)
 * @task T023
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('POST /conversation/freier-talk/end', () => {
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let testProjectId: string;
  let sessionId: string;
  let freierTalkId: string;

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

    // Start freier talk
    const freierTalkResponse = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Test topic',
    });
    freierTalkId = freierTalkResponse.freierTalkId;
  });

  it('should end active freier talk session', async () => {
    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.freierTalkId).toBe(freierTalkId);
    expect(response.status).toBe('ended');
    expect(response.duration).toBeGreaterThan(0);
  });

  it('should generate AI summary of insights', async () => {
    // Add some conversation
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'We discussed important architectural decisions',
    });

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.summary).toBeDefined();
    expect(typeof response.summary).toBe('string');
    expect(response.summary.length).toBeGreaterThan(0);
  });

  it('should extract key insights', async () => {
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'The main issue is technical debt in the payment module',
    });

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.keyInsights).toBeDefined();
    expect(Array.isArray(response.keyInsights)).toBe(true);
  });

  it('should set endedAt timestamp', async () => {
    const beforeEnd = new Date().toISOString();

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.endedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.endedAt).toBeGreaterThanOrEqual(beforeEnd);
  });

  it('should calculate total duration', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.duration).toBeGreaterThanOrEqual(100);
  });

  it('should resume normal question flow after ending', async () => {
    await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    // Should be able to get next question
    const nextQuestion = await conversationAPI.getNextQuestion(sessionId);
    expect(nextQuestion.question).toBeDefined();
  });

  it('should fail with invalid freierTalkId', async () => {
    const invalidId = crypto.randomUUID();

    await expect(
      conversationAPI.endFreierTalk(sessionId, invalidId)
    ).rejects.toThrow('Freier Talk entry not found');
  });

  it('should fail with already ended freier talk', async () => {
    await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    await expect(
      conversationAPI.endFreierTalk(sessionId, freierTalkId)
    ).rejects.toThrow('Freier Talk already ended');
  });

  it('should persist freier talk data to storage', async () => {
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'Important insight',
    });

    await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    const entry = await conversationAPI.getFreierTalkEntry(sessionId, freierTalkId);

    expect(entry.endedAt).toBeTruthy();
    expect(entry.duration).toBeGreaterThan(0);
    expect(entry.transcript.length).toBeGreaterThan(0);
  });

  it('should tag insights automatically', async () => {
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'We need better code review process and CI/CD pipeline',
    });

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.tags).toBeDefined();
    expect(Array.isArray(response.tags)).toBe(true);
  });

  it('should detect sentiment from conversation', async () => {
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'I am very frustrated with the deployment process',
    });

    const response = await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    expect(response.sentiment).toBeDefined();
    expect(['positive', 'neutral', 'negative', 'mixed']).toContain(response.sentiment);
  });

  it('should store complete transcript', async () => {
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'Message 1',
    });
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'ai',
      message: 'Response 1',
    });
    await conversationAPI.addFreierTalkMessage(sessionId, freierTalkId, {
      role: 'user',
      message: 'Message 2',
    });

    await conversationAPI.endFreierTalk(sessionId, freierTalkId);

    const entry = await conversationAPI.getFreierTalkEntry(sessionId, freierTalkId);
    expect(entry.transcript.length).toBeGreaterThanOrEqual(3);
  });
});
