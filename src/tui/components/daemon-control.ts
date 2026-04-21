/**
 * Daemon Control Panel Component
 * 
 * Control the MCP daemon service with visual status
 * and action buttons for start/stop/restart.
 */

import { DaemonTUIStatus } from '../types.js';
import { createStatusBadge } from './status-panel.js';

export type DaemonAction = 'start' | 'stop' | 'restart' | 'refresh' | 'logs';

/**
 * Daemon action button
 */
export interface DaemonActionButton {
  id: DaemonAction;
  label: string;
  description: string;
  enabled: boolean;
  confirmRequired?: boolean;
}

/**
 * Get available actions based on daemon status
 */
export function getAvailableActions(status: DaemonTUIStatus): DaemonActionButton[] {
  return [
    {
      id: 'start',
      label: 'Start Daemon',
      description: 'Start the MCP daemon service',
      enabled: !status.isRunning,
      confirmRequired: false,
    },
    {
      id: 'stop',
      label: 'Stop Daemon',
      description: 'Stop the running MCP daemon',
      enabled: status.isRunning,
      confirmRequired: true,
    },
    {
      id: 'restart',
      label: 'Restart Daemon',
      description: 'Restart the MCP daemon service',
      enabled: true,
      confirmRequired: false,
    },
    {
      id: 'refresh',
      label: 'Refresh Status',
      description: 'Refresh daemon status information',
      enabled: true,
      confirmRequired: false,
    },
    {
      id: 'logs',
      label: 'View Logs',
      description: 'View daemon logs',
      enabled: true,
      confirmRequired: false,
    },
  ];
}

/**
 * Render daemon control panel
 */
export function renderDaemonControlPanel(
  status: DaemonTUIStatus,
  selectedAction: number = 0,
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' DAEMON CONTROL PANEL'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  // Status section
  lines.push('┌─ STATUS ─' + '─'.repeat(Math.max(1, terminalWidth - 12)) + '┐');
  
  const indicator = status.isRunning ? '🟢' : '🔴';
  const statusText = status.isRunning ? 'RUNNING' : 'STOPPED';
  lines.push(`│ ${indicator} Daemon is ${statusText}`.padEnd(terminalWidth - 1) + '│');
  
  if (status.isRunning) {
    lines.push(`│ PID: ${status.pid || 'N/A'}`.padEnd(terminalWidth - 1) + '│');
    lines.push(`│ Health: ${status.healthStatus}`.padEnd(terminalWidth - 1) + '│');
    lines.push(`│ Cached Tools: ${status.cachedTools}`.padEnd(terminalWidth - 1) + '│');
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  
  // Actions section
  const actions = getAvailableActions(status);
  lines.push('┌─ ACTIONS ─' + '─'.repeat(Math.max(1, terminalWidth - 13)) + '┐');
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const isSelected = i === selectedAction;
    const indicator = isSelected ? '► ' : '  ';
    const disabled = !action.enabled ? ' (disabled)' : '';
    const line = `${indicator}${action.label}${disabled}`;
    
    lines.push(`│ ${line.padEnd(terminalWidth - 3)}│`);
    
    if (isSelected && action.description) {
      lines.push(`│ ${action.description}`.padEnd(terminalWidth - 1) + '│');
    }
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  
  // Metrics if running
  if (status.isRunning) {
    lines.push('┌─ METRICS ─' + '─'.repeat(Math.max(1, terminalWidth - 13)) + '┐');
    lines.push(`│ Uptime: ${formatUptime(status.uptime)}`.padEnd(terminalWidth - 1) + '│');
    lines.push(`│ Cache Hit Rate: ${(status.cacheHitRate * 100).toFixed(1)}%`.padEnd(terminalWidth - 1) + '│');
    lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  }
  
  lines.push('');
  
  // Controls hint
  lines.push('┌─ CONTROLS ─' + '─'.repeat(Math.max(1, terminalWidth - 15)) + '┐');
  lines.push('│ ↑/↓: Navigate  Enter: Execute  d: Dashboard  q: Quit'.padEnd(terminalWidth - 1) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Render confirmation dialog for daemon action
 */
export function renderDaemonActionConfirm(
  action: DaemonAction,
  terminalWidth: number = 60
): string[] {
  const messages: Record<DaemonAction, string> = {
    start: 'Start the MCP daemon service?',
    stop: 'Stop the running MCP daemon?',
    restart: 'Restart the MCP daemon?',
    refresh: 'Refresh daemon status?',
    logs: 'View daemon logs?',
  };
  
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' CONFIRM ACTION'.padStart(Math.floor(terminalWidth / 2) + 7).padEnd(terminalWidth - 1) + '║');
  lines.push('╠' + '═'.repeat(terminalWidth - 2) + '╣');
  lines.push(`║ ${messages[action]}`.padEnd(terminalWidth - 1) + '║');
  lines.push('║' + ' '.repeat(terminalWidth - 2) + '║');
  lines.push('║ [Y] Yes     [N] No'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  
  return lines;
}

/**
 * Render daemon logs view
 */
export function renderDaemonLogs(
  logs: string[],
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' DAEMON LOGS'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  const maxLines = terminalHeight - 10;
  const displayLogs = logs.slice(-maxLines);
  
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  
  for (const log of displayLogs) {
    // Truncate long lines
    const truncated = log.length > terminalWidth - 4
      ? log.substring(0, terminalWidth - 7) + '...'
      : log;
    
    lines.push(`│ ${truncated}`.padEnd(terminalWidth - 1) + '│');
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  lines.push('Showing last ' + displayLogs.length + ' log lines');
  
  return lines;
}

/**
 * Format uptime
 */
export function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Create action result message
 */
export function createActionResultMessage(
  action: DaemonAction,
  success: boolean,
  message?: string
): string {
  const actionNames: Record<DaemonAction, string> = {
    start: 'Started',
    stop: 'Stopped',
    restart: 'Restarted',
    refresh: 'Refreshed',
    logs: 'Loaded logs for',
  };
  
  if (success) {
    return `✓ ${actionNames[action]} daemon${message ? ': ' + message : ''}`;
  } else {
    return `✕ Failed to ${action} daemon${message ? ': ' + message : ''}`;
  }
}
