/**
 * Export Entity - Represents an exported survey result
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 437-477)
 * @task T009
 */

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'yaml' | 'markdown';

/**
 * Export entity
 */
export interface Export {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * Reference to parent Session ID
   */
  sessionId: string;

  /**
   * Export format
   */
  format: ExportFormat;

  /**
   * ISO 8601 timestamp of export creation
   */
  createdAt: string;

  /**
   * File path to exported file
   * @example ".wda/exports/session-001-2025-10-03.json"
   */
  filePath: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Checksum for integrity validation (SHA-256)
   */
  checksum: string;

  /**
   * Metadata
   */
  metadata: {
    /**
     * Export options used
     */
    options?: Record<string, any>;
    /**
     * Generation time in milliseconds
     */
    generationTime?: number;
    /**
     * Whether this export includes Freier Talk data
     */
    includesFreierTalk?: boolean;
  };
}

/**
 * Validation rules for Export entity
 */
export const ExportValidation = {
  validate(exportData: Partial<Export>): string[] {
    const errors: string[] = [];

    // ID validation
    if (!exportData.id || exportData.id.trim() === '') {
      errors.push('Export.id is required');
    }

    // Session ID validation
    if (!exportData.sessionId || exportData.sessionId.trim() === '') {
      errors.push('Export.sessionId is required');
    }

    // Format validation
    const validFormats: ExportFormat[] = ['json', 'yaml', 'markdown'];
    if (exportData.format && !validFormats.includes(exportData.format)) {
      errors.push(`Export.format must be one of: ${validFormats.join(', ')}`);
    }

    // File path validation
    if (!exportData.filePath || exportData.filePath.trim() === '') {
      errors.push('Export.filePath is required');
    }

    // File size validation
    if (exportData.fileSize !== undefined && exportData.fileSize < 0) {
      errors.push('Export.fileSize must be >= 0');
    }

    // Checksum validation (SHA-256 is 64 hex characters)
    if (exportData.checksum && !ExportValidation.isValidSHA256(exportData.checksum)) {
      errors.push('Export.checksum must be a valid SHA-256 hash (64 hex characters)');
    }

    return errors;
  },

  /**
   * Validates SHA-256 checksum format
   */
  isValidSHA256(checksum: string): boolean {
    const sha256Regex = /^[a-f0-9]{64}$/i;
    return sha256Regex.test(checksum);
  },
};

/**
 * Factory function to create a new Export
 */
export function createExport(params: {
  sessionId: string;
  format: ExportFormat;
  filePath: string;
  fileSize: number;
  checksum: string;
}): Export {
  return {
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    format: params.format,
    createdAt: new Date().toISOString(),
    filePath: params.filePath,
    fileSize: params.fileSize,
    checksum: params.checksum,
    metadata: {},
  };
}
