/**
 * SessionStorageProvider - Manages session persistence
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T011)
 * @task T011
 */

import type { Session } from '../models/Session';
import type { Response } from '../models/Response';
import type { FreierTalkEntry } from '../models/FreierTalkEntry';
import { LocalStorageProvider } from './LocalStorageProvider';

/**
 * SessionStorageProvider handles CRUD operations for sessions
 */
export class SessionStorageProvider {
  constructor(private storage: LocalStorageProvider) {}

  /**
   * Save a session
   */
  async saveSession(session: Session): Promise<void> {
    const filePath = `sessions/${session.id}.json`;
    await this.storage.writeJSON(filePath, session);
  }

  /**
   * Load a session by ID
   */
  async loadSession(sessionId: string): Promise<Session> {
    const filePath = `sessions/${sessionId}.json`;
    return await this.storage.readJSON<Session>(filePath);
  }

  /**
   * List all sessions for a project
   */
  async listSessions(projectId: string): Promise<Session[]> {
    const files = await this.storage.list('sessions');
    const sessions: Session[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const session = await this.storage.readJSON<Session>(`sessions/${file}`);
        if (session.projectId === projectId) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const filePath = `sessions/${sessionId}.json`;
    await this.storage.delete(filePath);
  }

  /**
   * Check if session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const filePath = `sessions/${sessionId}.json`;
    return await this.storage.exists(filePath);
  }

  /**
   * Save a response
   */
  async saveResponse(response: Response): Promise<void> {
    // Responses are stored within their session file
    // Load session, update responses array, save back
    const session = await this.loadSession(response.sessionId);

    // Add response ID if not already present
    if (!session.responseIds.includes(response.id)) {
      session.responseIds.push(response.id);
    }

    // Store response separately for easier access
    const filePath = `sessions/${response.sessionId}/responses/${response.id}.json`;
    await this.storage.writeJSON(filePath, response);

    // Update session
    await this.saveSession(session);
  }

  /**
   * Load a response by ID
   */
  async loadResponse(sessionId: string, responseId: string): Promise<Response> {
    const filePath = `sessions/${sessionId}/responses/${responseId}.json`;
    return await this.storage.readJSON<Response>(filePath);
  }

  /**
   * Load all responses for a session
   */
  async loadResponses(sessionId: string): Promise<Response[]> {
    const dirPath = `sessions/${sessionId}/responses`;

    try {
      const files = await this.storage.list(dirPath);
      const responses: Response[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const response = await this.storage.readJSON<Response>(`${dirPath}/${file}`);
          responses.push(response);
        }
      }

      return responses;
    } catch {
      // Directory doesn't exist yet (no responses)
      return [];
    }
  }

  /**
   * Save a Freier Talk entry
   */
  async saveFreierTalkEntry(entry: FreierTalkEntry): Promise<void> {
    const session = await this.loadSession(entry.sessionId);

    // Add entry ID if not already present
    if (!session.freierTalkIds.includes(entry.id)) {
      session.freierTalkIds.push(entry.id);
    }

    // Store entry separately
    const filePath = `sessions/${entry.sessionId}/freier-talk/${entry.id}.json`;
    await this.storage.writeJSON(filePath, entry);

    // Update session
    await this.saveSession(session);
  }

  /**
   * Load a Freier Talk entry by ID
   */
  async loadFreierTalkEntry(sessionId: string, entryId: string): Promise<FreierTalkEntry> {
    const filePath = `sessions/${sessionId}/freier-talk/${entryId}.json`;
    return await this.storage.readJSON<FreierTalkEntry>(filePath);
  }

  /**
   * Load all Freier Talk entries for a session
   */
  async loadFreierTalkEntries(sessionId: string): Promise<FreierTalkEntry[]> {
    const dirPath = `sessions/${sessionId}/freier-talk`;

    try {
      const files = await this.storage.list(dirPath);
      const entries: FreierTalkEntry[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const entry = await this.storage.readJSON<FreierTalkEntry>(`${dirPath}/${file}`);
          entries.push(entry);
        }
      }

      return entries;
    } catch {
      // Directory doesn't exist yet (no entries)
      return [];
    }
  }
}
