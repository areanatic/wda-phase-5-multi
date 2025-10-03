/**
 * ValidationEngine - Answer validation and follow-up detection
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T039)
 */

import { Question } from '../models/Question';
import { Response } from '../models/Response';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FollowUpTrigger {
  triggered: boolean;
  reason?: 'answer_too_short' | 'answer_too_vague' | 'contains_keywords' | 'answer_negative';
  followUpQuestion?: Question;
}

/**
 * ValidationEngine - Validates answers and detects follow-up needs
 */
export class ValidationEngine {
  /**
   * Validate answer against question type
   */
  validateAnswer(answer: any, question: Question): ValidationResult {
    const errors: string[] = [];

    // Required validation
    if (question.required) {
      if (answer === null || answer === undefined || answer === '') {
        errors.push('Answer is required');
        return { valid: false, errors };
      }
    }

    // Type-specific validation
    switch (question.type) {
      case 'text':
        if (typeof answer !== 'string') {
          errors.push('Answer type mismatch');
        }
        if (question.validation?.minLength && answer.length < question.validation.minLength) {
          errors.push(`Answer must be at least ${question.validation.minLength} characters`);
        }
        if (question.validation?.maxLength && answer.length > question.validation.maxLength) {
          errors.push(`Answer must be at most ${question.validation.maxLength} characters`);
        }
        break;

      case 'number':
        if (typeof answer !== 'number') {
          errors.push('Answer type mismatch');
        }
        break;

      case 'single_choice':
        if (typeof answer !== 'string') {
          errors.push('Answer type mismatch');
        }
        if (question.options) {
          const validOptions = question.options.de.concat(question.options.en);
          if (!validOptions.includes(answer)) {
            errors.push('Answer must be one of the provided options');
          }
        }
        break;

      case 'multiple_choice':
        if (!Array.isArray(answer)) {
          errors.push('Answer type mismatch');
        }
        if (question.options && Array.isArray(answer)) {
          const validOptions = question.options.de.concat(question.options.en);
          for (const a of answer) {
            if (!validOptions.includes(a)) {
              errors.push('All answers must be from provided options');
              break;
            }
          }
        }
        break;

      case 'scale':
        if (typeof answer !== 'number') {
          errors.push('Answer type mismatch');
        }
        if (question.scale) {
          const { min, max } = question.scale;
          if (answer < min || answer > max) {
            errors.push(`Answer must be between ${min} and ${max}`);
          }
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Detect if answer is too short
   */
  detectAnswerTooShort(answer: string, minLength = 20): boolean {
    return typeof answer === 'string' && answer.trim().length < minLength;
  }

  /**
   * Detect vague keywords
   */
  detectVagueKeywords(answer: string): boolean {
    const vagueKeywords = [
      'depends',
      'maybe',
      'sometimes',
      'it depends',
      'not sure',
      'dunno',
      'kommt drauf an',
      'vielleicht',
      'manchmal',
      'weiß nicht',
    ];

    const answerLower = answer.toLowerCase();
    return vagueKeywords.some((keyword) => answerLower.includes(keyword));
  }

  /**
   * Detect negative answer
   */
  detectNegativeAnswer(answer: string): boolean {
    const negativeKeywords = [
      'no',
      'nein',
      'not',
      'nicht',
      'never',
      'nie',
      'don\'t',
      'doesn\'t',
    ];

    const answerLower = answer.toLowerCase();
    return negativeKeywords.some((keyword) => answerLower.includes(keyword));
  }

  /**
   * Detect follow-up triggers based on answer
   */
  detectFollowUpTrigger(answer: string, question: Question): FollowUpTrigger {
    if (!question.followUpRules || question.followUpRules.length === 0) {
      return { triggered: false };
    }

    // Check each follow-up rule
    for (const rule of question.followUpRules) {
      let triggered = false;
      let reason: FollowUpTrigger['reason'];

      switch (rule.condition) {
        case 'answer_too_short':
          triggered = this.detectAnswerTooShort(answer, rule.threshold);
          reason = 'answer_too_short';
          break;

        case 'answer_too_vague':
          triggered = this.detectVagueKeywords(answer);
          reason = 'answer_too_vague';
          break;

        case 'contains_keywords':
          if (rule.keywords) {
            triggered = rule.keywords.some((kw) =>
              answer.toLowerCase().includes(kw.toLowerCase())
            );
            reason = 'contains_keywords';
          }
          break;

        case 'answer_negative':
          triggered = this.detectNegativeAnswer(answer);
          reason = 'answer_negative';
          break;
      }

      if (triggered && rule.followUpQuestion) {
        return {
          triggered: true,
          reason,
          followUpQuestion: rule.followUpQuestion,
        };
      }
    }

    return { triggered: false };
  }

  /**
   * Detect contradiction with previous answers (AI-based)
   * TODO: Implement with AI model
   */
  async detectContradiction(
    answer: string,
    previousAnswers: Response[],
    model: any
  ): Promise<boolean> {
    // Mock implementation for now
    return false;
  }
}
