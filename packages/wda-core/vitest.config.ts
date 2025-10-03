/**
 * Vitest Configuration for WDA Core
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T016-T036)
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
      ],
    },
    // Separate test suites by type
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    // Mock file system for storage tests
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
