/**
 * Auto-Refresh and Change Tracking Components
 * 
 * Real-time update mechanism and change indicators.
 */

export type ChangeType = 'added' | 'modified' | 'removed' | 'none';

export interface Change {
  type: ChangeType;
  itemId: string;
  previousValue?: unknown;
  newValue?: unknown;
  timestamp: number;
}

export interface AutoRefreshConfig {
  interval: number; // milliseconds
  maxUpdates?: number;
  maxAge?: number; // milliseconds to keep changes
}

/**
 * Track changes between old and new data
 */
export class ChangeTracker {
  private changes: Map<string, Change> = new Map();
  private lastUpdateTime: number = Date.now();

  /**
   * Track a change
   */
  trackChange(change: Change): void {
    this.changes.set(change.itemId, change);
    this.lastUpdateTime = Date.now();
  }

  /**
   * Get all tracked changes
   */
  getChanges(): Change[] {
    return Array.from(this.changes.values());
  }

  /**
   * Get changes of specific type
   */
  getChangesByType(type: ChangeType): Change[] {
    return Array.from(this.changes.values()).filter(c => c.type === type);
  }

  /**
   * Clear all changes
   */
  clearChanges(): void {
    this.changes.clear();
  }

  /**
   * Clear old changes (by age)
   */
  clearOldChanges(maxAge: number): void {
    const now = Date.now();
    for (const [id, change] of this.changes.entries()) {
      if (now - change.timestamp > maxAge) {
        this.changes.delete(id);
      }
    }
  }

  /**
   * Check if item has changes
   */
  hasChanges(itemId: string): boolean {
    return this.changes.has(itemId);
  }

  /**
   * Get change for specific item
   */
  getChange(itemId: string): Change | undefined {
    return this.changes.get(itemId);
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  /**
   * Count changes by type
   */
  countByType(type: ChangeType): number {
    return Array.from(this.changes.values()).filter(c => c.type === type).length;
  }
}

/**
 * Detect changes between old and new string arrays
 */
export function detectChanges(
  oldData: string[],
  newData: string[],
  idExtractor?: (line: string, index: number) => string
): Change[] {
  const changes: Change[] = [];
  const now = Date.now();

  // If no ID extractor, use line index as ID
  const getItemId = idExtractor ?? ((line: string, idx: number) => `line_${idx}`);

  // Track which items existed before
  const oldItems = new Set<string>();
  for (let i = 0; i < oldData.length; i++) {
    oldItems.add(getItemId(oldData[i], i));
  }

  // Track which items exist now
  const newItems = new Set<string>();
  for (let i = 0; i < newData.length; i++) {
    const itemId = getItemId(newData[i], i);
    newItems.add(itemId);

    if (!oldItems.has(itemId)) {
      // New item
      changes.push({
        type: 'added',
        itemId,
        newValue: newData[i],
        timestamp: now,
      });
    } else if (oldData[i] !== newData[i]) {
      // Modified item
      changes.push({
        type: 'modified',
        itemId,
        previousValue: oldData[i],
        newValue: newData[i],
        timestamp: now,
      });
    }
  }

  // Find removed items
  for (const itemId of oldItems) {
    if (!newItems.has(itemId)) {
      changes.push({
        type: 'removed',
        itemId,
        timestamp: now,
      });
    }
  }

  return changes;
}

/**
 * Highlight changes in rendered output
 */
export function highlightChanges(
  lines: string[],
  changes: Change[],
  changeMap: Map<string, ChangeType>
): string[] {
  const highlighted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const changeType = changeMap.get(`line_${i}`);

    if (changeType === 'added') {
      highlighted.push(`✚ ${line} (added)`);
    } else if (changeType === 'modified') {
      highlighted.push(`◆ ${line} (modified)`);
    } else if (changeType === 'removed') {
      highlighted.push(`✕ ${line} (removed)`);
    } else {
      highlighted.push(line);
    }
  }

  return highlighted;
}

/**
 * Apply change type color codes (ANSI)
 */
export const COLOR_ADDED = '\x1b[32m'; // Green
export const COLOR_MODIFIED = '\x1b[33m'; // Yellow
export const COLOR_REMOVED = '\x1b[2m'; // Dim gray
export const COLOR_RESET = '\x1b[0m'; // Reset

/**
 * Colorize line based on change type
 */
export function colorizeChange(line: string, changeType: ChangeType): string {
  switch (changeType) {
    case 'added':
      return `${COLOR_ADDED}${line}${COLOR_RESET}`;
    case 'modified':
      return `${COLOR_MODIFIED}${line}${COLOR_RESET}`;
    case 'removed':
      return `${COLOR_REMOVED}${line}${COLOR_RESET}`;
    default:
      return line;
  }
}

/**
 * Render change indicator badge
 */
export function renderChangeBadge(changeType: ChangeType): string {
  switch (changeType) {
    case 'added':
      return '✚';
    case 'modified':
      return '◆';
    case 'removed':
      return '✕';
    default:
      return ' ';
  }
}

/**
 * Create a change for comparison
 */
export function createChange(
  type: ChangeType,
  itemId: string,
  options: Partial<Change> = {}
): Change {
  return {
    type,
    itemId,
    previousValue: options.previousValue,
    newValue: options.newValue,
    timestamp: options.timestamp ?? Date.now(),
  };
}

/**
 * Filter changes by criteria
 */
export function filterChanges(
  changes: Change[],
  predicate: (change: Change) => boolean
): Change[] {
  return changes.filter(predicate);
}

/**
 * Sort changes by timestamp
 */
export function sortChangesByTime(changes: Change[], ascending: boolean = false): Change[] {
  return [...changes].sort((a, b) =>
    ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
  );
}

/**
 * Get summary of changes
 */
export interface ChangeSummary {
  total: number;
  added: number;
  modified: number;
  removed: number;
}

export function summarizeChanges(changes: Change[]): ChangeSummary {
  return {
    total: changes.length,
    added: changes.filter(c => c.type === 'added').length,
    modified: changes.filter(c => c.type === 'modified').length,
    removed: changes.filter(c => c.type === 'removed').length,
  };
}

/**
 * Render change summary
 */
export function renderChangeSummary(summary: ChangeSummary, width: number = 50): string[] {
  const lines: string[] = [];

  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  lines.push(`│ Total: ${summary.total}, Added: ${summary.added}, Modified: ${summary.modified}, Removed: ${summary.removed}`.padEnd(width - 1) + '│');
  lines.push('└' + '─'.repeat(width - 2) + '┘');

  return lines;
}
