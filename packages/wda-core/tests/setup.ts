/**
 * Vitest Test Setup
 * Global test utilities and mocks
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Test workspace directory (in temp)
export const TEST_WORKSPACE = path.join(os.tmpdir(), 'wda-test-workspace');

// UUID regex for validation
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Session ID regex
export const SESSION_ID_REGEX = /^session-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Create test workspace before all tests
beforeAll(async () => {
  await fs.mkdir(TEST_WORKSPACE, { recursive: true });
});

// Clean up after each test
afterEach(async () => {
  try {
    // Remove .wda directory if it exists
    const wdaDir = path.join(TEST_WORKSPACE, '.wda');
    await fs.rm(wdaDir, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }
});

// Clean up test workspace after all tests
afterAll(async () => {
  try {
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }
});
