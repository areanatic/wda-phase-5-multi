/**
 * Path Utilities - Path manipulation and validation
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T015)
 * @task T015
 */

import * as path from 'path';
import * as os from 'os';

/**
 * Normalize a file path (cross-platform)
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get absolute path
 */
export function absolutePath(filePath: string, basePath?: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const base = basePath || process.cwd();
  return path.resolve(base, filePath);
}

/**
 * Get relative path from base to target
 */
export function relativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Check if path is absolute
 */
export function isAbsolute(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

/**
 * Get directory name from path
 */
export function dirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get base name from path
 */
export function basename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * Get file extension
 */
export function extname(filePath: string): string {
  return path.extname(filePath);
}

/**
 * Check if path is within base directory (prevent path traversal)
 */
export function isWithinDirectory(filePath: string, baseDir: string): boolean {
  const normalized = normalizePath(filePath);
  const normalizedBase = normalizePath(baseDir);

  const relative = path.relative(normalizedBase, normalized);

  // If relative path starts with "..", it's outside the base directory
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Sanitize file name (remove invalid characters)
 */
export function sanitizeFileName(fileName: string): string {
  // Remove invalid characters for file names
  return fileName.replace(/[<>:"|?*\x00-\x1F]/g, '_')
    .replace(/\.\./g, '_') // Prevent path traversal
    .replace(/^\./, '_'); // Prevent hidden files
}

/**
 * Generate safe file name from session name and timestamp
 */
export function generateFileName(sessionName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitized = sanitizeFileName(sessionName);
  return `${sanitized}-${timestamp}.${extension}`;
}

/**
 * Get WDA base directory for a workspace
 */
export function getWDABaseDir(workspacePath: string): string {
  return joinPaths(workspacePath, '.wda');
}

/**
 * Get sessions directory
 */
export function getSessionsDir(workspacePath: string): string {
  return joinPaths(getWDABaseDir(workspacePath), 'sessions');
}

/**
 * Get checkpoints directory
 */
export function getCheckpointsDir(workspacePath: string): string {
  return joinPaths(getWDABaseDir(workspacePath), 'checkpoints');
}

/**
 * Get exports directory
 */
export function getExportsDir(workspacePath: string): string {
  return joinPaths(getWDABaseDir(workspacePath), 'exports');
}

/**
 * Get session file path
 */
export function getSessionFilePath(workspacePath: string, sessionId: string): string {
  return joinPaths(getSessionsDir(workspacePath), `${sessionId}.json`);
}

/**
 * Get checkpoint file path
 */
export function getCheckpointFilePath(workspacePath: string, sessionId: string, checkpointId: string): string {
  return joinPaths(getCheckpointsDir(workspacePath), sessionId, `checkpoint-${checkpointId}.json`);
}

/**
 * Get export file path
 */
export function getExportFilePath(
  workspacePath: string,
  sessionName: string,
  format: 'json' | 'yaml' | 'markdown'
): string {
  const fileName = generateFileName(sessionName, format === 'markdown' ? 'md' : format);
  return joinPaths(getExportsDir(workspacePath), fileName);
}

/**
 * Expand home directory (~) in path
 */
export function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    return filePath.replace('~', os.homedir());
  }
  return filePath;
}

/**
 * Get platform-specific path separator
 */
export function getPathSeparator(): string {
  return path.sep;
}
