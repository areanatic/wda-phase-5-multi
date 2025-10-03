/**
 * ExportService - Session export to JSON/YAML/Markdown
 */

import { Export, ExportFormat, createExport } from '../models/Export';
import { SessionStorageProvider } from '../storage/SessionStorageProvider';
import { LocalStorageProvider } from '../storage/LocalStorageProvider';
import { getExportsDir, getExportFilePath } from '../utils/path';
import * as crypto from 'crypto';
import * as yaml from 'js-yaml';

export interface ExportOptions {
  includeFreierTalk?: boolean;
  prettify?: boolean;
}

/**
 * ExportService - Export sessions to various formats
 */
export class ExportService {
  private sessionStorage: SessionStorageProvider;
  private localStorage: LocalStorageProvider;

  constructor(private workspacePath: string) {
    this.localStorage = new LocalStorageProvider(workspacePath);
    this.sessionStorage = new SessionStorageProvider(this.localStorage);
  }

  async initialize(): Promise<void> {
    await this.localStorage.initialize();
  }

  /**
   * Export session (POST /export/generate)
   */
  async exportSession(
    sessionId: string,
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<Export> {
    await this.initialize();

    // Validate format
    if (!['json', 'yaml', 'markdown'].includes(format)) {
      throw new Error('Invalid export format');
    }

    // Load session data
    const session = await this.sessionStorage.loadSession(sessionId);
    const responses = await this.sessionStorage.loadResponses(sessionId);
    const freierTalkEntries = options?.includeFreierTalk !== false
      ? await this.sessionStorage.loadFreierTalkEntries(sessionId)
      : [];

    // Anonymize paths
    const anonymizedSession = {
      ...session,
      workspacePath: '[PROJECT_ROOT]',
    };

    // Build export data
    const exportData: any = {
      metadata: {
        schemaVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        format,
      },
      session: anonymizedSession,
      responses,
    };

    if (options?.includeFreierTalk !== false && freierTalkEntries.length > 0) {
      exportData.freierTalkEntries = freierTalkEntries;
    }

    // Generate content
    let content: string;
    const startTime = Date.now();

    switch (format) {
      case 'json':
        content = options?.prettify
          ? JSON.stringify(exportData, null, 2)
          : JSON.stringify(exportData);
        break;

      case 'yaml':
        content = yaml.dump(exportData);
        break;

      case 'markdown':
        content = this.generateMarkdown(exportData);
        break;
    }

    const generationTime = Date.now() - startTime;

    // Generate file path
    const filePath = getExportFilePath(this.workspacePath, session.name, format);

    // Write file
    await this.localStorage.write(filePath, content);

    // Calculate file size and checksum
    const stats = await this.localStorage.stat(filePath);
    const checksum = crypto.createHash('sha256').update(content).digest('hex');

    // Create export record
    const exportRecord = createExport({
      sessionId,
      format,
      filePath,
      fileSize: stats.size,
      checksum,
      metadata: {
        generationTime,
        includesFreierTalk: options?.includeFreierTalk !== false && freierTalkEntries.length > 0,
        options,
      },
    });

    // Update session export count
    session.metadata = session.metadata || {};
    session.metadata.exportCount = (session.metadata.exportCount || 0) + 1;
    await this.sessionStorage.saveSession(session);

    return exportRecord;
  }

  /**
   * Generate Markdown export
   */
  private generateMarkdown(data: any): string {
    const { session, responses, freierTalkEntries } = data;

    let md = `# ${session.name}\n\n`;
    md += `## Session Information\n\n`;
    md += `- **Status**: ${session.status}\n`;
    md += `- **Mode**: ${session.mode}\n`;
    md += `- **Started**: ${session.startedAt}\n`;
    md += `- **Progress**: ${session.progress}%\n\n`;

    md += `## Responses\n\n`;
    for (const response of responses) {
      md += `### ${response.questionId}\n\n`;
      md += `**Answer**: ${response.answer}\n\n`;
      md += `**Time Spent**: ${response.timeSpent}ms\n\n`;
    }

    if (freierTalkEntries && freierTalkEntries.length > 0) {
      md += `## Freier Talk Sessions\n\n`;
      for (const entry of freierTalkEntries) {
        md += `### ${entry.trigger}\n\n`;
        md += `**Duration**: ${entry.duration}ms\n\n`;
        md += `**Key Insights**: ${entry.keyInsights.join(', ')}\n\n`;
      }
    }

    return md;
  }
}
