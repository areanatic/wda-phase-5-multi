/**
 * Test Data Generators
 * Factories for creating test entities
 */

import { Project, createProject } from '@/models/Project';
import { Session, createSession } from '@/models/Session';
import { Response, createResponse } from '@/models/Response';
import { Question } from '@/models/Question';
import { QuestionPack } from '@/models/QuestionPack';
import { Config, DEFAULT_CONFIG } from '@/models/Config';
import { FreierTalkEntry, createFreierTalkEntry } from '@/models/FreierTalkEntry';
import { Checkpoint, createCheckpoint } from '@/models/Checkpoint';
import { TEST_WORKSPACE } from '../setup';

/**
 * Create test project
 */
export function createTestProject(overrides?: Partial<Project>): Project {
  return createProject({
    workspacePath: TEST_WORKSPACE,
    name: 'Test Project',
    ...overrides,
  });
}

/**
 * Create test config
 */
export function createTestConfig(overrides?: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}

/**
 * Create test session
 */
export function createTestSession(projectId: string, overrides?: Partial<Session>): Session {
  return createSession({
    projectId,
    name: 'Test Session',
    mode: 'quick',
    selectedPackIds: ['pack-1'],
    ...overrides,
  });
}

/**
 * Create test question
 */
export function createTestQuestion(overrides?: Partial<Question>): Question {
  return {
    id: `question-${crypto.randomUUID()}`,
    text: {
      de: 'Test Frage',
      en: 'Test Question',
    },
    type: 'text',
    required: true,
    applicableModes: ['quick', 'standard', 'deep'],
    metadata: {},
    ...overrides,
  };
}

/**
 * Create test question pack
 */
export function createTestQuestionPack(overrides?: Partial<QuestionPack>): QuestionPack {
  const question1 = createTestQuestion({ id: 'q1' });
  const question2 = createTestQuestion({ id: 'q2' });

  return {
    id: `pack-${crypto.randomUUID()}`,
    name: {
      de: 'Test Pack',
      en: 'Test Pack',
    },
    description: {
      de: 'Test Beschreibung',
      en: 'Test Description',
    },
    version: '1.0.0',
    author: {
      name: 'Test Author',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [question1, question2],
    metadata: {},
    ...overrides,
  };
}

/**
 * Create test response
 */
export function createTestResponse(
  sessionId: string,
  questionId: string,
  overrides?: Partial<Response>
): Response {
  return createResponse({
    sessionId,
    questionId,
    answer: 'Test answer',
    ...overrides,
  });
}

/**
 * Create test freier talk entry
 */
export function createTestFreierTalkEntry(
  sessionId: string,
  overrides?: Partial<FreierTalkEntry>
): FreierTalkEntry {
  return createFreierTalkEntry({
    sessionId,
    trigger: 'user_initiated',
    ...overrides,
  });
}

/**
 * Create test checkpoint
 */
export function createTestCheckpoint(sessionId: string, overrides?: Partial<Checkpoint>): Checkpoint {
  return createCheckpoint({
    sessionId,
    sessionSnapshot: {
      currentQuestionIndex: 0,
      progress: 0,
      responseCount: 0,
      freierTalkCount: 0,
    },
    reason: 'auto_save',
    backupPath: `/tmp/checkpoint-${sessionId}.json`,
    ...overrides,
  });
}
