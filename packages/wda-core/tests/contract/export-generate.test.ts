/**
 * Contract Test - POST /export/generate
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T025)
 * @task T025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService } from '@/export/ExportService';
import { SessionAPI } from '@/engine/SessionAPI';
import { ConversationAPI } from '@/engine/ConversationAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE, UUID_REGEX } from '../setup';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('POST /export/generate', () => {
  let exportService: ExportService;
  let sessionAPI: SessionAPI;
  let conversationAPI: ConversationAPI;
  let testProjectId: string;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    testProjectId = project.id;
    exportService = new ExportService(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);
    conversationAPI = new ConversationAPI(TEST_WORKSPACE);

    // Create test session with some data
    const session = await sessionAPI.createSession({
      projectId: testProjectId,
      name: 'Export Test Session',
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });

    sessionId = session.id;
  });

  it('should export session as JSON', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    expect(response.exportId).toMatch(UUID_REGEX);
    expect(response.format).toBe('json');
    expect(response.filePath).toBeTruthy();
    expect(response.filePath).toMatch(/\.json$/);
  });

  it('should export session as YAML', async () => {
    const response = await exportService.exportSession(sessionId, 'yaml');

    expect(response.format).toBe('yaml');
    expect(response.filePath).toMatch(/\.yaml$/);
  });

  it('should export session as Markdown', async () => {
    const response = await exportService.exportSession(sessionId, 'markdown');

    expect(response.format).toBe('markdown');
    expect(response.filePath).toMatch(/\.md$/);
  });

  it('should create export file in exports directory', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    const fileExists = await fs
      .access(response.filePath)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);
    expect(response.filePath).toContain('.wda/exports');
  });

  it('should include session data in JSON export', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    const fileContent = await fs.readFile(response.filePath, 'utf-8');
    const exportData = JSON.parse(fileContent);

    expect(exportData.session).toBeDefined();
    expect(exportData.session.id).toBe(sessionId);
    expect(exportData.session.name).toBe('Export Test Session');
  });

  it('should include responses in export', async () => {
    await sessionAPI.startSession(sessionId);

    const question = await conversationAPI.getNextQuestion(sessionId);
    await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'Test answer',
    });

    const response = await exportService.exportSession(sessionId, 'json');

    const fileContent = await fs.readFile(response.filePath, 'utf-8');
    const exportData = JSON.parse(fileContent);

    expect(exportData.responses).toBeDefined();
    expect(Array.isArray(exportData.responses)).toBe(true);
    expect(exportData.responses.length).toBeGreaterThan(0);
  });

  it('should include freier talk entries in export', async () => {
    await sessionAPI.startSession(sessionId);

    const freierTalk = await conversationAPI.startFreierTalk(sessionId, {
      trigger: 'user_initiated',
      initialMessage: 'Test insight',
    });
    await conversationAPI.endFreierTalk(sessionId, freierTalk.freierTalkId);

    const response = await exportService.exportSession(sessionId, 'json');

    const fileContent = await fs.readFile(response.filePath, 'utf-8');
    const exportData = JSON.parse(fileContent);

    expect(exportData.freierTalkEntries).toBeDefined();
    expect(exportData.freierTalkEntries.length).toBe(1);
  });

  it('should calculate file size', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    expect(response.fileSize).toBeGreaterThan(0);

    const stats = await fs.stat(response.filePath);
    expect(response.fileSize).toBe(stats.size);
  });

  it('should generate SHA-256 checksum', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    expect(response.checksum).toBeDefined();
    expect(response.checksum.length).toBe(64); // SHA-256 hex string
    expect(response.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should fail with invalid sessionId', async () => {
    const invalidId = 'session-' + crypto.randomUUID();

    await expect(exportService.exportSession(invalidId, 'json')).rejects.toThrow(
      'Session not found'
    );
  });

  it('should fail with invalid format', async () => {
    await expect(
      exportService.exportSession(sessionId, 'xml' as any)
    ).rejects.toThrow('Invalid export format');
  });

  it('should support custom export options', async () => {
    const response = await exportService.exportSession(sessionId, 'json', {
      includeFreierTalk: false,
      prettify: true,
    });

    const fileContent = await fs.readFile(response.filePath, 'utf-8');
    const exportData = JSON.parse(fileContent);

    expect(response.metadata.includesFreierTalk).toBe(false);
  });

  it('should generate unique filenames for multiple exports', async () => {
    const export1 = await exportService.exportSession(sessionId, 'json');
    await new Promise((resolve) => setTimeout(resolve, 10));
    const export2 = await exportService.exportSession(sessionId, 'json');

    expect(export1.filePath).not.toBe(export2.filePath);
  });

  it('should include metadata in export', async () => {
    const response = await exportService.exportSession(sessionId, 'json');

    expect(response.metadata).toBeDefined();
    expect(response.metadata.generationTime).toBeGreaterThan(0);
  });

  it('should format Markdown export correctly', async () => {
    await sessionAPI.startSession(sessionId);

    const question = await conversationAPI.getNextQuestion(sessionId);
    await conversationAPI.submitAnswer(sessionId, {
      questionId: question.question.id,
      answer: 'Test answer',
    });

    const response = await exportService.exportSession(sessionId, 'markdown');

    const fileContent = await fs.readFile(response.filePath, 'utf-8');

    expect(fileContent).toContain('# Export Test Session');
    expect(fileContent).toContain('## Responses');
    expect(fileContent).toMatch(/^#/m); // Contains markdown headers
  });

  it('should export abandoned sessions', async () => {
    await sessionAPI.abandonSession(sessionId);

    const response = await exportService.exportSession(sessionId, 'json');

    const fileContent = await fs.readFile(response.filePath, 'utf-8');
    const exportData = JSON.parse(fileContent);

    expect(exportData.session.status).toBe('abandoned');
  });

  it('should track export history in session', async () => {
    const export1 = await exportService.exportSession(sessionId, 'json');
    const export2 = await exportService.exportSession(sessionId, 'yaml');

    const session = await sessionAPI.getSession(sessionId);

    expect(session.metadata?.exportCount).toBe(2);
  });
});
