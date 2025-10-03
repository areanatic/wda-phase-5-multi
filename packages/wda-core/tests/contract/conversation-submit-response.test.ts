/**
 * Contract Test - POST /conversation/submit-response
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T021)
 * @task T021
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE, UUID_REGEX } from '../setup';

describe('POST /conversation/submit-response', () => {
  let conversationAPI: ConversationAPI;
  let sessionAPI: SessionAPI;
  let testProjectId: string;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    // Create and start session
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

  it('should accept valid text answer', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'This is my detailed answer to the question',
    });

    expect(response.responseId).toMatch(UUID_REGEX);
    expect(response.validated).toBe(true);
    expect(response.errors).toEqual([]);
  });

  it('should accept number answer for number question', async () => {
    // Assuming we have a number-type question
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (questionResponse.question.type === 'number') {
      const response = await conversationAPI.submitAnswer(sessionId, {
        questionId: questionResponse.question.id,
        answer: 42,
      });

      expect(response.validated).toBe(true);
    }
  });

  it('should validate answer type matches question type', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (questionResponse.question.type === 'text') {
      await expect(
        conversationAPI.submitAnswer(sessionId, {
          questionId: questionResponse.question.id,
          answer: 123, // Invalid: number for text question
        })
      ).rejects.toThrow('Answer type mismatch');
    }
  });

  it('should validate required answers', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (questionResponse.question.required) {
      await expect(
        conversationAPI.submitAnswer(sessionId, {
          questionId: questionResponse.question.id,
          answer: '', // Empty answer for required question
        })
      ).rejects.toThrow('Answer is required');
    }
  });

  it('should detect follow-up trigger conditions', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'No', // Short answer that might trigger follow-up
    });

    expect(response).toHaveProperty('followUpTriggered');
    expect(typeof response.followUpTriggered).toBe('boolean');

    if (response.followUpTriggered) {
      expect(response.followUpQuestion).toBeDefined();
    }
  });

  it('should return AI feedback for answer', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'Detailed answer with good information',
    });

    expect(response.aiFeedback).toBeDefined();
    expect(typeof response.aiFeedback).toBe('string');
  });

  it('should store time spent on question', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'Test answer',
      timeSpent: Date.now() - startTime,
    });

    expect(response.timeSpent).toBeGreaterThanOrEqual(100);
  });

  it('should fail with invalid questionId', async () => {
    const invalidQuestionId = 'question-' + crypto.randomUUID();

    await expect(
      conversationAPI.submitAnswer(sessionId, {
        questionId: invalidQuestionId,
        answer: 'Test answer',
      })
    ).rejects.toThrow('Question not found');
  });

  it('should fail with invalid sessionId', async () => {
    const invalidSessionId = 'session-' + crypto.randomUUID();

    await expect(
      conversationAPI.submitAnswer(invalidSessionId, {
        questionId: 'question-123',
        answer: 'Test answer',
      })
    ).rejects.toThrow('Session not found');
  });

  it('should validate single choice answer is from options', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (
      questionResponse.question.type === 'single_choice' &&
      questionResponse.question.options
    ) {
      await expect(
        conversationAPI.submitAnswer(sessionId, {
          questionId: questionResponse.question.id,
          answer: 'Invalid Option',
        })
      ).rejects.toThrow('Answer must be one of the provided options');
    }
  });

  it('should validate multiple choice answers are from options', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (
      questionResponse.question.type === 'multiple_choice' &&
      questionResponse.question.options
    ) {
      await expect(
        conversationAPI.submitAnswer(sessionId, {
          questionId: questionResponse.question.id,
          answer: ['Valid Option', 'Invalid Option'],
        })
      ).rejects.toThrow('All answers must be from provided options');
    }
  });

  it('should validate scale answer is within range', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    if (questionResponse.question.type === 'scale' && questionResponse.question.scale) {
      const { min, max } = questionResponse.question.scale;

      await expect(
        conversationAPI.submitAnswer(sessionId, {
          questionId: questionResponse.question.id,
          answer: max + 1, // Out of range
        })
      ).rejects.toThrow(`Answer must be between ${min} and ${max}`);
    }
  });

  it('should update session progress after answer', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const beforeProgress = questionResponse.progress.percentComplete;

    await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'Test answer',
    });

    const updatedSession = await sessionAPI.getSession(sessionId);
    expect(updatedSession.progress).toBeGreaterThanOrEqual(beforeProgress);
  });

  it('should persist response to storage', async () => {
    const questionResponse = await conversationAPI.getNextQuestion(sessionId);

    const response = await conversationAPI.submitAnswer(sessionId, {
      questionId: questionResponse.question.id,
      answer: 'Test answer for persistence',
    });

    // Verify response was saved
    const session = await sessionAPI.getSession(sessionId);
    expect(session.responseIds).toContain(response.responseId);
  });
});
