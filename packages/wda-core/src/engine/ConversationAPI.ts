/**
 * ConversationAPI - Conversation and question flow operations
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T037)
 */

import { Session } from '../models/Session';
import { Question } from '../models/Question';
import { Response, createResponse } from '../models/Response';
import { FreierTalkEntry, createFreierTalkEntry, FreierTalkTrigger } from '../models/FreierTalkEntry';
import { SessionStorageProvider } from '../storage/SessionStorageProvider';
import { LocalStorageProvider } from '../storage/LocalStorageProvider';

export interface NextQuestionResponse {
  question: Question;
  progress: {
    current: number;
    total: number;
    percentComplete: number;
  };
  aiMessage: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string | number | boolean | string[];
  timeSpent?: number;
}

export interface SubmitAnswerResponse {
  responseId: string;
  validated: boolean;
  errors: string[];
  followUpTriggered: boolean;
  followUpQuestion?: Question;
  aiFeedback: string;
  timeSpent: number;
  metadata?: {
    freierTalkPotential?: 'low' | 'medium' | 'high';
  };
}

export interface StartFreierTalkRequest {
  trigger: FreierTalkTrigger;
  triggeredByQuestionId?: string;
  initialMessage?: string;
}

export interface StartFreierTalkResponse {
  freierTalkId: string;
  status: 'active';
  aiResponse: string;
}

export interface EndFreierTalkResponse {
  freierTalkId: string;
  status: 'ended';
  duration: number;
  endedAt: string;
  summary: string;
  keyInsights: string[];
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

/**
 * ConversationAPI - Core conversation engine
 */
export class ConversationAPI {
  private storage: SessionStorageProvider;
  private localStorage: LocalStorageProvider;

  constructor(private workspacePath: string) {
    this.localStorage = new LocalStorageProvider(workspacePath);
    this.storage = new SessionStorageProvider(this.localStorage);
  }

  async initialize(): Promise<void> {
    await this.localStorage.initialize();
  }

  /**
   * Get next question (POST /conversation/next-question)
   */
  async getNextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    await this.initialize();
    const session = await this.storage.loadSession(sessionId);

    if (session.status === 'paused') {
      throw new Error('Session is paused');
    }

    if (session.status === 'abandoned') {
      throw new Error('Session is abandoned');
    }

    // Mock question for now (will be replaced by QuestionSelector)
    const mockQuestion: Question = {
      id: `question-${crypto.randomUUID()}`,
      text: {
        de: 'Wie läuft euer Code Review ab?',
        en: 'How does your code review process work?',
      },
      type: 'text',
      required: true,
      applicableModes: ['quick', 'standard', 'deep'],
      metadata: {},
    };

    const total = 10; // Mock total
    const current = session.currentQuestionIndex;
    const percentComplete = Math.round((current / total) * 100);

    if (current >= total) {
      throw new Error('No more questions');
    }

    return {
      question: mockQuestion,
      progress: {
        current,
        total,
        percentComplete,
      },
      aiMessage: `Nächstes Thema: Code Reviews. Beschreib mal, wie läuft das bei euch ab?`,
    };
  }

  /**
   * Submit answer (POST /conversation/submit-response)
   */
  async submitAnswer(
    sessionId: string,
    request: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    await this.initialize();
    const session = await this.storage.loadSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!request.questionId) {
      throw new Error('Question not found');
    }

    // Create response
    const response = createResponse({
      sessionId,
      questionId: request.questionId,
      answer: request.answer,
      timeSpent: request.timeSpent || 0,
    });

    // Save response
    await this.storage.saveResponse(response);

    // Update session
    session.responseIds.push(response.id);
    session.currentQuestionIndex++;
    session.progress = Math.round((session.currentQuestionIndex / 10) * 100);
    session.updatedAt = new Date().toISOString();
    await this.storage.saveSession(session);

    return {
      responseId: response.id,
      validated: true,
      errors: [],
      followUpTriggered: false,
      aiFeedback: 'Danke für deine Antwort!',
      timeSpent: response.timeSpent,
    };
  }

  /**
   * Start Freier Talk (POST /conversation/freier-talk/start)
   */
  async startFreierTalk(
    sessionId: string,
    request: StartFreierTalkRequest
  ): Promise<StartFreierTalkResponse> {
    await this.initialize();
    const session = await this.storage.loadSession(sessionId);

    if (session.status === 'paused') {
      throw new Error('Session is paused');
    }

    if (session.status === 'abandoned') {
      throw new Error('Session is abandoned');
    }

    const entry = createFreierTalkEntry({
      sessionId,
      trigger: request.trigger,
      triggeredByQuestionId: request.triggeredByQuestionId,
    });

    // Add initial message if provided
    if (request.initialMessage) {
      entry.transcript.push({
        role: 'user',
        message: request.initialMessage,
        timestamp: new Date().toISOString(),
      });
    }

    await this.storage.saveFreierTalkEntry(entry);

    // Update session
    session.freierTalkIds.push(entry.id);
    session.updatedAt = new Date().toISOString();
    await this.storage.saveSession(session);

    return {
      freierTalkId: entry.id,
      status: 'active',
      aiResponse: 'Interessant! Erzähl mir mehr darüber. Was genau ist dir dabei aufgefallen?',
    };
  }

  /**
   * End Freier Talk (POST /conversation/freier-talk/end)
   */
  async endFreierTalk(sessionId: string, freierTalkId: string): Promise<EndFreierTalkResponse> {
    const entry = await this.getFreierTalkEntry(sessionId, freierTalkId);

    if (entry.endedAt) {
      throw new Error('Freier Talk already ended');
    }

    const now = new Date().toISOString();
    entry.endedAt = now;
    entry.duration = Date.now() - new Date(entry.startedAt).getTime();

    // Generate summary and insights (mock for now)
    const summary = 'Wir haben über wichtige Workflow-Aspekte gesprochen.';
    const keyInsights = ['Process improvement needed', 'Communication gaps identified'];
    const tags = ['workflow', 'process'];
    const sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';

    entry.keyInsights = keyInsights;
    entry.tags = tags;
    entry.sentiment = sentiment;

    await this.storage.saveFreierTalkEntry(entry);

    return {
      freierTalkId,
      status: 'ended',
      duration: entry.duration,
      endedAt: now,
      summary,
      keyInsights,
      tags,
      sentiment,
    };
  }

  /**
   * Add message to Freier Talk
   */
  async addFreierTalkMessage(
    sessionId: string,
    freierTalkId: string,
    message: { role: 'user' | 'ai'; message: string }
  ): Promise<void> {
    const entry = await this.getFreierTalkEntry(sessionId, freierTalkId);

    entry.transcript.push({
      ...message,
      timestamp: new Date().toISOString(),
    });

    await this.storage.saveFreierTalkEntry(entry);
  }

  /**
   * Get Freier Talk entry
   */
  async getFreierTalkEntry(sessionId: string, freierTalkId: string): Promise<FreierTalkEntry> {
    const entries = await this.storage.loadFreierTalkEntries(sessionId);
    const entry = entries.find((e) => e.id === freierTalkId);

    if (!entry) {
      throw new Error('Freier Talk entry not found');
    }

    return entry;
  }
}
