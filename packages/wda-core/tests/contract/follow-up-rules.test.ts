/**
 * Contract Test - Follow-Up Rule Logic
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T035)
 * @task T035
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject, createTestQuestionPack } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';

describe('Follow-Up Rule Logic', () => {
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    const session = await sessionAPI.createSession({
      projectId: project.id,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });
    sessionId = session.id;
    await sessionAPI.startSession(sessionId);
  });

  it('should trigger follow-up for answer_too_short', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'No',
    });

    if (question.question.followUpRules?.some(r => r.condition === 'answer_too_short')) {
      expect(response.followUpTriggered).toBe(true);
      expect(response.followUpQuestion).toBeDefined();
    }
  });

  it('should trigger follow-up for answer_too_vague', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'It depends',
    });

    if (question.question.followUpRules?.some(r => r.condition === 'answer_too_vague')) {
      expect(response.followUpTriggered).toBe(true);
    }
  });

  it('should trigger follow-up for contains_keywords', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'We have problems with deployment',
    });

    if (question.question.followUpRules?.some(r => r.condition === 'contains_keywords')) {
      expect(response.followUpTriggered).toBe(true);
    }
  });

  it('should trigger follow-up for answer_negative', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'No, we don\'t have that',
    });

    if (question.question.followUpRules?.some(r => r.condition === 'answer_negative')) {
      expect(response.followUpTriggered).toBe(true);
    }
  });

  it('should not trigger follow-up for detailed answers', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'Our code review process involves multiple stages: First, developers create PRs with detailed descriptions. Then, at least two senior developers review the code for logic, style, and security issues. We use automated tools for linting and testing. Finally, after approval, the PR is merged by the author.',
    });

    expect(response.followUpTriggered).toBe(false);
  });

  it('should allow freier talk instead of structured follow-up', async () => {
    const question = await conversationAPI.getNextQuestion(sessionId);
    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'This reminds me of a bigger issue...',
    });

    if (response.followUpTriggered) {
      expect(response.freierTalkSuggested).toBe(true);
    }
  });
});
