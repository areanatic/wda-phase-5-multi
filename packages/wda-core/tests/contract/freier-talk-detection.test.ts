/**
 * Contract Test - Freier Talk Detection
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T036)
 * @task T036
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FreierTalkDetector } from '@/engine/FreierTalkDetector';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('Freier Talk Detection', () => {
  let detector: FreierTalkDetector;
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let sessionId: string;

  beforeEach(async () => {
    detector = new FreierTalkDetector();
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    const project = createTestProject();
    const session = await sessionAPI.createSession({
      projectId: project.id,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });
    sessionId = session.id;
  });

  it('should detect frustration in user answers', () => {
    const frustratedAnswer = 'I am so frustrated with our deployment process, nothing works!';
    const result = detector.detectFrustration(frustratedAnswer);

    expect(result.detected).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should detect digression from question topic', () => {
    const questionTopic = 'code review';
    const digressingAnswer = 'That reminds me, we also have issues with our database migrations...';

    const result = detector.detectDigression(questionTopic, digressingAnswer);

    expect(result.detected).toBe(true);
  });

  it('should suggest freier talk for highly emotional responses', () => {
    const emotionalAnswer = 'I hate our current system! It\'s terrible and causes so many problems!';
    const result = detector.shouldSuggestFreierTalk(emotionalAnswer);

    expect(result).toBe(true);
  });

  it('should not trigger for neutral, on-topic answers', () => {
    const neutralAnswer = 'We use GitHub PRs for code review with 2 approvers required.';
    const result = detector.detectFrustration(neutralAnswer);

    expect(result.detected).toBe(false);
  });

  it('should detect insight-rich digressions', () => {
    const insightfulAnswer = 'Actually, this connects to a broader pattern I\'ve noticed about team communication...';
    const result = detector.detectInsightOpportunity(insightfulAnswer);

    expect(result.detected).toBe(true);
    expect(result.freierTalkPotential).toBe('high');
  });

  it('should provide freier talk transition message', () => {
    const answer = 'I want to talk about something related but different...';
    const result = detector.generateTransitionMessage(answer);

    expect(result.message).toBeTruthy();
    expect(result.message).toMatch(/(interessant|spannend|gern|erzähl)/i);
  });

  it('should track freier talk potential in metadata', async () => {
    await sessionAPI.startSession(sessionId);
    const question = await conversationAPI.getNextQuestion(sessionId);

    const answer = 'This actually connects to multiple other problems we have...';
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer,
    });

    expect(response.metadata?.freierTalkPotential).toBeDefined();
  });
});
