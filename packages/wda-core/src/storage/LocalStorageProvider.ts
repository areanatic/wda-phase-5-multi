/**
 * LocalStorageProvider - Manages local file system storage for WDA
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T010)
 * @task T010
 */

import * as fs from 'fs/promises';
import type { Stats } from 'fs';
import * as path from 'path';

/**
 * Storage options
 */
export interface StorageOptions {
  /**
   * Base directory for WDA storage
   * @default ".wda"
   */
  baseDir?: string;

  /**
   * Whether to create directories if they don't exist
   * @default true
   */
  autoCreate?: boolean;

  /**
   * File encoding
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
}

/**
 * LocalStorageProvider handles all file system operations
 */
export class LocalStorageProvider {
  private baseDir: string;
  private autoCreate: boolean;
  private encoding: BufferEncoding;

  constructor(workspacePath: string, options: StorageOptions = {}) {
    this.baseDir = path.join(workspacePath, options.baseDir || '.wda');
    this.autoCreate = options.autoCreate ?? true;
    this.encoding = options.encoding || 'utf-8';
  }

  /**
   * Initialize storage (create base directory structure)
   */
  async initialize(): Promise<void> {
    if (this.autoCreate) {
      await this.ensureDirectory(this.baseDir);
      await this.ensureDirectory(path.join(this.baseDir, 'sessions'));
      await this.ensureDirectory(path.join(this.baseDir, 'checkpoints'));
      await this.ensureDirectory(path.join(this.baseDir, 'exports'));
    }
  }

  /**
   * Read a file
   */
  async read(filePath: string): Promise<string> {
    const fullPath = this.resolvePath(filePath);
    return await fs.readFile(fullPath, this.encoding);
  }

  /**
   * Read and parse JSON file
   */
  async readJSON<T = any>(filePath: string): Promise<T> {
    const content = await this.read(filePath);
    return JSON.parse(content);
  }

  /**
   * Write a file
   */
  async write(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await this.ensureDirectory(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, this.encoding);
  }

  /**
   * Write JSON file
   */
  async writeJSON(filePath: string, data: any, pretty = true): Promise<void> {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await this.write(filePath, content);
  }

  /**
   * Delete a file
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.unlink(fullPath);
  }

  /**
   * Check if file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in directory
   */
  async list(dirPath: string): Promise<string[]> {
    const fullPath = this.resolvePath(dirPath);
    return await fs.readdir(fullPath);
  }

  /**
   * Get file stats
   */
  async stat(filePath: string): Promise<Stats> {
    const fullPath = this.resolvePath(filePath);
    return await fs.stat(fullPath);
  }

  /**
   * Get base directory path
   */
  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Resolve relative path to absolute
   */
  private resolvePath(filePath: string): string {
    // If already absolute, return as-is
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    // Otherwise, resolve relative to baseDir
    return path.join(this.baseDir, filePath);
  }

  /**
   * Ensure directory exists (create if needed)
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      // Ignore error if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
