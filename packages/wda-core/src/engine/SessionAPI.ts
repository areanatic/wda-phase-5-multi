/**
 * SessionAPI - Session management operations
 *
 * @see ../../../specs/001-phase-5-multi/contracts/core-api.yaml
 * @see ../../../specs/001-phase-5-multi/tasks.md (T037+)
 */

import { Session, createSession } from '../models/Session';
import { SessionStorageProvider } from '../storage/SessionStorageProvider';
import { CheckpointStorageProvider } from '../storage/CheckpointStorageProvider';
import { LocalStorageProvider } from '../storage/LocalStorageProvider';
import { isValidUUID, generateSessionId, isValidSessionId } from '../utils/uuid';
import { AIProvider } from '../models/Config';

export interface CreateSessionRequest {
  projectId: string;
  name?: string;
  mode: 'quick' | 'standard' | 'deep';
  modelConfig: {
    provider: AIProvider;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface ResumeSessionResponse {
  session: Session;
  aiSummary: string;
}

/**
 * SessionAPI - Core session management operations
 */
export class SessionAPI {
  private storage: SessionStorageProvider;
  private checkpointStorage: CheckpointStorageProvider;
  private localStorage: LocalStorageProvider;

  constructor(private workspacePath: string) {
    this.localStorage = new LocalStorageProvider(workspacePath);
    this.storage = new SessionStorageProvider(this.localStorage);
    this.checkpointStorage = new CheckpointStorageProvider(this.localStorage);
  }

  /**
   * Initialize storage (call before first use)
   */
  async initialize(): Promise<void> {
    await this.localStorage.initialize();
  }

  /**
   * Create new session (POST /session/create)
   */
  async createSession(request: CreateSessionRequest): Promise<Session> {
    // Ensure storage is initialized
    await this.initialize();

    // Validate projectId
    if (!request.projectId) {
      throw new Error('projectId is required');
    }

    if (!isValidUUID(request.projectId)) {
      throw new Error('Invalid projectId format');
    }

    // Validate mode
    if (!['quick', 'standard', 'deep'].includes(request.mode)) {
      throw new Error('Invalid mode');
    }

    // Validate modelConfig
    if (request.modelConfig.temperature !== undefined) {
      if (request.modelConfig.temperature < 0 || request.modelConfig.temperature > 1) {
        throw new Error('Temperature must be between 0.0 and 1.0');
      }
    }

    if (request.modelConfig.maxTokens !== undefined) {
      if (request.modelConfig.maxTokens < 100 || request.modelConfig.maxTokens > 4000) {
        throw new Error('maxTokens must be between 100 and 4000');
      }
    }

    // Generate session name if not provided
    const name = request.name || `Session ${new Date().toLocaleDateString()}`;

    // Create session
    const session = createSession({
      projectId: request.projectId,
      name,
      mode: request.mode,
      selectedPackIds: [], // Will be populated by QuestionSelector
    });

    // Save to storage
    await this.storage.saveSession(session);

    return session;
  }

  /**
   * Start session (transition to in_progress)
   */
  async startSession(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId);

    if (session.status !== 'not_started') {
      throw new Error('Session already started');
    }

    session.status = 'in_progress';
    session.updatedAt = new Date().toISOString();

    await this.storage.saveSession(session);
    return session;
  }

  /**
   * Resume paused session (POST /session/{sessionId}/resume)
   */
  async resumeSession(sessionId: string): Promise<ResumeSessionResponse> {
    if (!isValidSessionId(sessionId)) {
      throw new Error('Invalid sessionId format');
    }

    const session = await this.getSession(sessionId);

    if (session.status !== 'paused') {
      throw new Error('Session is not paused');
    }

    // Update status
    session.status = 'in_progress';
    session.updatedAt = new Date().toISOString();

    await this.storage.saveSession(session);

    // Generate AI summary
    const aiSummary = `Hey! Schön, dass du wieder da bist! 😊 Letztes Mal haben wir über deinen Workflow gesprochen. Du hast schon ${session.responseIds.length} Fragen beantwortet. Lass uns weitermachen!`;

    return {
      session,
      aiSummary,
    };
  }

  /**
   * Pause session (POST /session/{sessionId}/pause)
   */
  async pauseSession(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId);

    if (session.status === 'paused') {
      throw new Error('Session is already paused');
    }

    if (session.status === 'abandoned' || session.status === 'completed') {
      throw new Error(`Cannot pause ${session.status} session`);
    }

    // Create auto checkpoint
    await this.checkpointStorage.createCheckpoint(session, 'auto_save');

    // Update status
    session.status = 'paused';
    session.updatedAt = new Date().toISOString();

    await this.storage.saveSession(session);
    return session;
  }

  /**
   * Abandon session (POST /session/{sessionId}/abandon)
   */
  async abandonSession(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId);

    if (session.status === 'abandoned') {
      throw new Error('Session is already abandoned');
    }

    session.status = 'abandoned';
    session.updatedAt = new Date().toISOString();

    await this.storage.saveSession(session);
    return session;
  }

  /**
   * Complete session
   */
  async completeSession(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId);

    if (session.status !== 'in_progress') {
      throw new Error('Session must be in_progress to complete');
    }

    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    session.progress = 100;

    await this.storage.saveSession(session);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    try {
      return await this.storage.loadSession(sessionId);
    } catch {
      throw new Error('Session not found');
    }
  }
}
