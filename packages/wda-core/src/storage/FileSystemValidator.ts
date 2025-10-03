/**
 * FileSystemValidator - Validates file system operations
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T013)
 * @task T013
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * FileSystemValidator provides validation utilities
 */
export class FileSystemValidator {
  /**
   * Validate workspace path
   */
  static async validateWorkspacePath(workspacePath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if path is absolute
    if (!path.isAbsolute(workspacePath)) {
      errors.push('Workspace path must be absolute');
    }

    // Check if path exists
    try {
      await fs.access(workspacePath);
    } catch {
      errors.push('Workspace path does not exist');
      return { valid: false, errors };
    }

    // Check if it's a directory
    try {
      const stats = await fs.stat(workspacePath);
      if (!stats.isDirectory()) {
        errors.push('Workspace path must be a directory');
      }
    } catch (error: any) {
      errors.push(`Failed to stat workspace path: ${error.message}`);
    }

    // Check write permissions
    try {
      const testFile = path.join(workspacePath, '.wda-test-' + Date.now());
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch {
      errors.push('No write permissions in workspace directory');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate file path (doesn't have to exist)
   */
  static validateFilePath(filePath: string): ValidationResult {
    const errors: string[] = [];

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(filePath)) {
      errors.push('File path contains invalid characters');
    }

    // Check for path traversal attempts
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      errors.push('Path traversal not allowed');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate directory path
   */
  static async validateDirectoryPath(dirPath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        errors.push('Path is not a directory');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        errors.push('Directory does not exist');
      } else {
        errors.push(`Failed to access directory: ${error.message}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate file exists
   */
  static async validateFileExists(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        errors.push('Path is not a file');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        errors.push('File does not exist');
      } else {
        errors.push(`Failed to access file: ${error.message}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate JSON file content
   */
  static async validateJSONFile(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // First check if file exists
    const existsResult = await FileSystemValidator.validateFileExists(filePath);
    if (!existsResult.valid) {
      return existsResult;
    }

    // Try to parse JSON
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      JSON.parse(content);
    } catch (error: any) {
      errors.push(`Invalid JSON: ${error.message}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate storage directory structure
   */
  static async validateStorageStructure(baseDir: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // Required directories
    const requiredDirs = ['sessions', 'checkpoints', 'exports'];

    for (const dir of requiredDirs) {
      const dirPath = path.join(baseDir, dir);
      const result = await FileSystemValidator.validateDirectoryPath(dirPath);

      if (!result.valid) {
        errors.push(`Missing or invalid directory: ${dir}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check available disk space
   */
  static async checkDiskSpace(dirPath: string, requiredBytes: number): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Note: This is a simplified check
      // In production, use a library like 'check-disk-space' for accurate results
      const stats = await fs.statfs(dirPath);
      const availableBytes = stats.bavail * stats.bsize;

      if (availableBytes < requiredBytes) {
        errors.push(`Insufficient disk space. Required: ${requiredBytes} bytes, Available: ${availableBytes} bytes`);
      }
    } catch (error: any) {
      errors.push(`Failed to check disk space: ${error.message}`);
    }

    return { valid: errors.length === 0, errors };
  }
}
