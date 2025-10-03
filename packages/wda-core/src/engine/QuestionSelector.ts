/**
 * QuestionSelector - Adaptive question selection based on mode
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T038)
 */

import { Session, SurveyMode } from '../models/Session';
import { Question } from '../models/Question';
import { QuestionPack } from '../models/QuestionPack';

/**
 * QuestionSelector - Selects questions adaptively based on survey mode
 */
export class QuestionSelector {
  private questionPacks: QuestionPack[] = [];

  constructor(packs: QuestionPack[]) {
    this.questionPacks = packs;
  }

  /**
   * Select question packs for a given mode
   * Quick: ~22 questions (2-3 packs)
   * Standard: ~50 questions (6-8 packs)
   * Deep: ~90 questions (12-15 packs)
   */
  selectQuestionPacks(mode: SurveyMode): QuestionPack[] {
    const allPacks = [...this.questionPacks];

    switch (mode) {
      case 'quick':
        // Select 2-3 core packs (~22 questions)
        return allPacks.slice(0, 3);

      case 'standard':
        // Select 6-8 packs (~50 questions)
        return allPacks.slice(0, 8);

      case 'deep':
        // Select all packs (~90 questions)
        return allPacks;
    }
  }

  /**
   * Get next question for session
   */
  getNextQuestion(session: Session, allQuestions: Question[]): Question | null {
    const { currentQuestionIndex } = session;

    if (currentQuestionIndex >= allQuestions.length) {
      return null; // No more questions
    }

    return allQuestions[currentQuestionIndex];
  }

  /**
   * Get all questions for selected packs (filtered by mode)
   */
  getQuestionsForSession(session: Session): Question[] {
    const packs = this.questionPacks.filter((pack) =>
      session.selectedPackIds.includes(pack.id)
    );

    const allQuestions: Question[] = [];

    for (const pack of packs) {
      const filteredQuestions = pack.questions.filter((q) =>
        q.applicableModes.includes(session.mode)
      );
      allQuestions.push(...filteredQuestions);
    }

    return allQuestions;
  }

  /**
   * Skip irrelevant questions based on previous answers
   */
  skipIrrelevantQuestions(
    question: Question,
    previousAnswers: Map<string, any>
  ): boolean {
    // For now, simple implementation
    // TODO: Add conditional logic based on previous answers
    return false;
  }

  /**
   * Calculate question count estimates
   */
  static getQuestionCountEstimate(mode: SurveyMode): { min: number; max: number } {
    switch (mode) {
      case 'quick':
        return { min: 20, max: 25 };
      case 'standard':
        return { min: 45, max: 55 };
      case 'deep':
        return { min: 85, max: 95 };
    }
  }
}
