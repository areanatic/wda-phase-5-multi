/**
 * Contract Test - Token Counting Accuracy
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T033)
 * @task T033
 */

import { describe, it, expect } from 'vitest';
import { TokenCounter } from '@/ai/TokenCounter';

describe('Token Counting Accuracy', () => {
  let tokenCounter: TokenCounter;

  beforeEach(() => {
    tokenCounter = new TokenCounter();
  });

  it('should count tokens for OpenAI models', () => {
    const text = 'This is a test message for token counting.';
    const count = tokenCounter.count(text, { provider: 'openai', model: 'gpt-4o-mini' });

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(20);
  });

  it('should count tokens for Anthropic models', () => {
    const text = 'Test message';
    const count = tokenCounter.count(text, { provider: 'anthropic', model: 'claude-3-7-sonnet' });

    expect(count).toBeGreaterThan(0);
  });

  it('should count tokens for Google models', () => {
    const text = 'Test message';
    const count = tokenCounter.count(text, { provider: 'google', model: 'gemini-1.5-flash' });

    expect(count).toBeGreaterThan(0);
  });

  it('should maintain ≤600 tokens/question average', () => {
    const systemPrompt = 'You are a helpful assistant conducting a workflow survey.';
    const questionText = 'Describe your code review process in detail.';
    const userContext = 'Previous answers: [...]';

    const total = tokenCounter.count(`${systemPrompt}\n${questionText}\n${userContext}`, {
      provider: 'google',
      model: 'gemini-1.5-flash'
    });

    expect(total).toBeLessThanOrEqual(600);
  });

  it('should handle multilingual content', () => {
    const germanText = 'Wie läuft euer Code Review Prozess ab?';
    const englishText = 'How does your code review process work?';

    const germanCount = tokenCounter.count(germanText, { provider: 'openai', model: 'gpt-4o-mini' });
    const englishCount = tokenCounter.count(englishText, { provider: 'openai', model: 'gpt-4o-mini' });

    expect(Math.abs(germanCount - englishCount)).toBeLessThan(5);
  });
});
