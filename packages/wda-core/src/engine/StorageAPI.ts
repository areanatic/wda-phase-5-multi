/**
 * StorageAPI - Storage and data access operations
 */

import { Session } from '../models/Session';
import { SessionStorageProvider } from '../storage/SessionStorageProvider';
import { LocalStorageProvider } from '../storage/LocalStorageProvider';
import { isValidUUID } from '../utils/uuid';

export interface ListSessionsResponse {
  sessions: Session[];
  total: number;
  hasMore: boolean;
}

export interface ListSessionsOptions {
  status?: Session['status'];
  limit?: number;
  offset?: number;
  createdAfter?: string;
}

/**
 * StorageAPI - Data access operations
 */
export class StorageAPI {
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
   * List sessions (GET /storage/session/list)
   */
  async listSessions(
    projectId: string,
    options?: ListSessionsOptions
  ): Promise<ListSessionsResponse> {
    await this.initialize();

    if (!isValidUUID(projectId)) {
      throw new Error('Invalid projectId format');
    }

    let sessions = await this.storage.listSessions(projectId);

    // Filter by status
    if (options?.status) {
      sessions = sessions.filter((s) => s.status === options.status);
    }

    // Filter by date
    if (options?.createdAfter) {
      sessions = sessions.filter((s) => s.startedAt >= options.createdAfter!);
    }

    // Sort by creation date (newest first)
    sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    // Pagination
    const total = sessions.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || total;

    const paginatedSessions = sessions.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      sessions: paginatedSessions,
      total,
      hasMore,
    };
  }
}
