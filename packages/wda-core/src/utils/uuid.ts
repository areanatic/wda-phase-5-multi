/**
 * UUID Utilities - UUID generation and validation
 *
 * @see ../../../specs/001-phase-5-multi/tasks.md (T014)
 * @task T014
 */

/**
 * Generate a UUID v4
 * Uses native crypto.randomUUID() which is available in Node.js 19+
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Validate UUID format (v4)
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate UUID version
 */
export function getUUIDVersion(uuid: string): number | null {
  if (!isValidUUID(uuid)) {
    return null;
  }

  const versionChar = uuid.charAt(14);
  return parseInt(versionChar, 16);
}

/**
 * Generate a session ID with "session-" prefix
 */
export function generateSessionId(): string {
  return `session-${generateUUID()}`;
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId.startsWith('session-')) {
    return false;
  }

  const uuid = sessionId.substring(8); // Remove "session-" prefix
  return isValidUUID(uuid);
}

/**
 * Parse UUID to components
 */
export function parseUUID(uuid: string): {
  timeLow: string;
  timeMid: string;
  timeHiAndVersion: string;
  clockSeqHiAndReserved: string;
  clockSeqLow: string;
  node: string;
} | null {
  if (!isValidUUID(uuid)) {
    return null;
  }

  const parts = uuid.split('-');

  return {
    timeLow: parts[0],
    timeMid: parts[1],
    timeHiAndVersion: parts[2],
    clockSeqHiAndReserved: parts[3].substring(0, 2),
    clockSeqLow: parts[3].substring(2, 4),
    node: parts[4],
  };
}
