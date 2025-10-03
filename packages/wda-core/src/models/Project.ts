/**
 * Project Entity - Represents a developer's workspace where WDA surveys are conducted
 *
 * @see ../../../specs/001-phase-5-multi/data-model.md (lines 45-70)
 * @task T001
 */

/**
 * Project entity representing a workspace where surveys are conducted
 */
export interface Project {
  /**
   * Unique identifier (UUID v4)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Absolute path to workspace root
   * @example "/Users/developer/projects/my-app"
   */
  workspacePath: string;

  /**
   * User-friendly name (defaults to workspace folder name)
   * @example "my-app"
   */
  name: string;

  /**
   * ISO 8601 timestamp of project creation
   * @example "2025-10-03T18:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last modification
   * @example "2025-10-03T20:15:30.000Z"
   */
  updatedAt: string;

  /**
   * References to Session IDs belonging to this project
   * Can be empty for new projects
   * @example ["session-001", "session-002"]
   */
  sessionIds: string[];
}

/**
 * Validation rules for Project entity
 */
export const ProjectValidation = {
  /**
   * Validates a project object
   * @param project - Project object to validate
   * @returns Validation errors (empty array if valid)
   */
  validate(project: Partial<Project>): string[] {
    const errors: string[] = [];

    // UUID validation
    if (!project.id || !ProjectValidation.isValidUUID(project.id)) {
      errors.push('Project.id must be a valid UUID v4');
    }

    // Workspace path validation
    if (!project.workspacePath || project.workspacePath.trim() === '') {
      errors.push('Project.workspacePath is required');
    }

    // Name validation
    if (!project.name || project.name.trim() === '') {
      errors.push('Project.name is required');
    }

    // Timestamps validation
    if (!project.createdAt || !ProjectValidation.isValidISO8601(project.createdAt)) {
      errors.push('Project.createdAt must be a valid ISO 8601 timestamp');
    }

    if (!project.updatedAt || !ProjectValidation.isValidISO8601(project.updatedAt)) {
      errors.push('Project.updatedAt must be a valid ISO 8601 timestamp');
    }

    // Session IDs validation
    if (!Array.isArray(project.sessionIds)) {
      errors.push('Project.sessionIds must be an array');
    }

    return errors;
  },

  /**
   * Validates UUID v4 format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validates ISO 8601 timestamp format
   */
  isValidISO8601(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  },
};

/**
 * Factory function to create a new Project
 */
export function createProject(params: {
  workspacePath: string;
  name: string;
  id?: string;
}): Project {
  const now = new Date().toISOString();

  return {
    id: params.id || crypto.randomUUID(),
    workspacePath: params.workspacePath,
    name: params.name,
    createdAt: now,
    updatedAt: now,
    sessionIds: [],
  };
}
