/**
 * QuestionPackLoader - Loads question packs from YAML files
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { QuestionPack } from '../models/QuestionPack';

/**
 * QuestionPackLoader - Loads and validates question packs
 */
export class QuestionPackLoader {
  private packsDir: string;

  constructor(packsDir?: string) {
    // Default to question-packs directory in package root
    this.packsDir = packsDir || path.join(__dirname, '../../question-packs');
  }

  /**
   * Load a single question pack from YAML file
   */
  async loadPack(filename: string): Promise<QuestionPack> {
    const filePath = path.join(this.packsDir, filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const pack = yaml.load(fileContent) as QuestionPack;

    // Set timestamps if not present
    if (!pack.createdAt) {
      pack.createdAt = new Date().toISOString();
    }
    if (!pack.updatedAt) {
      pack.updatedAt = new Date().toISOString();
    }

    return pack;
  }

  /**
   * Load all question packs from directory
   */
  async loadAllPacks(): Promise<QuestionPack[]> {
    const files = await fs.readdir(this.packsDir);
    const yamlFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    const packs: QuestionPack[] = [];

    for (const file of yamlFiles) {
      try {
        const pack = await this.loadPack(file);
        packs.push(pack);
      } catch (error) {
        console.error(`Failed to load question pack ${file}:`, error);
      }
    }

    // Sort by ID for consistent ordering
    return packs.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Load packs by IDs
   */
  async loadPacksByIds(packIds: string[]): Promise<QuestionPack[]> {
    const allPacks = await this.loadAllPacks();
    return allPacks.filter((pack) => packIds.includes(pack.id));
  }

  /**
   * Get pack count estimate for mode
   */
  async getPackCountForMode(mode: 'quick' | 'standard' | 'deep'): Promise<number> {
    const allPacks = await this.loadAllPacks();

    switch (mode) {
      case 'quick':
        return Math.min(3, allPacks.length);
      case 'standard':
        return Math.min(8, allPacks.length);
      case 'deep':
        return allPacks.length;
    }
  }

  /**
   * Get total question count estimate for mode
   */
  async getQuestionCountForMode(mode: 'quick' | 'standard' | 'deep'): Promise<number> {
    const allPacks = await this.loadAllPacks();
    let selectedPacks: QuestionPack[];

    switch (mode) {
      case 'quick':
        selectedPacks = allPacks.slice(0, 3);
        break;
      case 'standard':
        selectedPacks = allPacks.slice(0, 8);
        break;
      case 'deep':
        selectedPacks = allPacks;
        break;
    }

    let totalQuestions = 0;
    for (const pack of selectedPacks) {
      // Count questions applicable to this mode
      const applicableQuestions = pack.questions.filter((q) =>
        q.applicableModes.includes(mode)
      );
      totalQuestions += applicableQuestions.length;
    }

    return totalQuestions;
  }
}
