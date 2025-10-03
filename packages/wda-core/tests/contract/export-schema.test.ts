/**
 * Contract Test - Export Schema Validation
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T032)
 * @task T032
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService } from '@/export/ExportService';
import { SessionAPI } from '@/engine/SessionAPI';
import { createTestProject } from '../helpers/test-data';
import { TEST_WORKSPACE } from '../setup';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

describe('Export Schema Validation', () => {
  let exportService: ExportService;
  let sessionAPI: SessionAPI;
  let sessionId: string;

  beforeEach(async () => {
    const project = createTestProject();
    exportService = new ExportService(TEST_WORKSPACE);
    sessionAPI = new SessionAPI(TEST_WORKSPACE);

    const session = await sessionAPI.createSession({
      projectId: project.id,
      mode: 'standard',
      modelConfig: { provider: 'google', modelName: 'gemini-1.5-flash' },
    });
    sessionId = session.id;
  });

  it('should validate JSON export matches schema', async () => {
    const result = await exportService.exportSession(sessionId, 'json');
    const content = JSON.parse(await fs.readFile(result.filePath, 'utf-8'));

    expect(content).toHaveProperty('session');
    expect(content).toHaveProperty('responses');
    expect(content).toHaveProperty('metadata');
    expect(content.metadata.schemaVersion).toBe('1.0.0');
  });

  it('should validate YAML export is parseable', async () => {
    const result = await exportService.exportSession(sessionId, 'yaml');
    const content = await fs.readFile(result.filePath, 'utf-8');

    const parsed = yaml.load(content);
    expect(parsed).toHaveProperty('session');
  });

  it('should validate Markdown export structure', async () => {
    const result = await exportService.exportSession(sessionId, 'markdown');
    const content = await fs.readFile(result.filePath, 'utf-8');

    expect(content).toMatch(/^# /m);
    expect(content).toContain('## Session Information');
    expect(content).toContain('## Responses');
  });

  it('should validate includeFreierTalk option', async () => {
    const result = await exportService.exportSession(sessionId, 'json', {
      includeFreierTalk: false
    });
    const content = JSON.parse(await fs.readFile(result.filePath, 'utf-8'));

    expect(content.freierTalkEntries).toBeUndefined();
  });

  it('should anonymize paths in export', async () => {
    const result = await exportService.exportSession(sessionId, 'json');
    const content = JSON.parse(await fs.readFile(result.filePath, 'utf-8'));
    const jsonStr = JSON.stringify(content);

    expect(jsonStr).not.toContain(TEST_WORKSPACE);
    expect(content.session.workspacePath).toMatch(/\[PROJECT_ROOT\]/);
  });
});
