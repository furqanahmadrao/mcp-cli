/**
 * Status Panel Component
 * 
 * Displays daemon status, health information, and metrics
 * in a formatted panel on the dashboard.
 */

import { DaemonTUIStatus, DashboardMetrics, ComponentProps } from '../types.js';
import { spacing, boxStyles, createBox } from '../styles/theme.js';

/**
 * Format daemon status as colored indicator
 */
function formatStatusIndicator(isRunning: boolean, health: string): string {
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';
  
  const indicators = {
    running: {
      healthy: `${GREEN}●${RESET} Running (Healthy)`,
      degraded: `${YELLOW}●${RESET} Running (Degraded)`,
      unhealthy: `${RED}●${RESET} Running (Unhealthy)`,
    },
    stopped: {
      healthy: `${YELLOW}●${RESET} Stopped`,
      degraded: `${YELLOW}●${RESET} Stopped`,
      unhealthy: `${RED}●${RESET} Stopped`,
    },
  };
  
  const state = isRunning ? 'running' : 'stopped';
  return indicators[state][health as keyof typeof indicators[typeof state]];
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds?: number): string {
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
 * Format memory in human readable units
 */
function formatMemory(bytes?: number): string {
  if (!bytes) return 'N/A';
  
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Create a status line with label and value
 */
function formatStatusLine(label: string, value: string | number, width: number = 40): string {
  const valueStr = String(value);
  const separator = '.'.repeat(Math.max(1, width - label.length - valueStr.length - 2));
  return `${label} ${separator} ${valueStr}`;
}

/**
 * Render daemon status panel
 */
export function renderDaemonStatusPanel(
  status: DaemonTUIStatus,
  width: number = 45
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('┌─ DAEMON STATUS ─'.padEnd(width - 1, '─') + '┐');
  
  // Status indicator
  const indicator = formatStatusIndicator(status.isRunning, status.healthStatus);
  lines.push(`│ ${indicator.padEnd(width - 3)}│`);
  
  // Divider
  lines.push('│' + '─'.repeat(width - 2) + '│');
  
  // Details
  if (status.isRunning) {
    lines.push(`│ PID: ${String(status.pid || 'N/A').padEnd(width - 9)}│`);
    lines.push(`│ Uptime: ${formatUptime(status.uptime).padEnd(width - 11)}│`);
    
    if (status.memoryUsage) {
      lines.push(`│ Memory: ${formatMemory(status.memoryUsage).padEnd(width - 11)}│`);
    }
    
    lines.push(`│ Cached Tools: ${String(status.cachedTools).padEnd(width - 18)}│`);
    lines.push(`│ Cache Hit Rate: ${String((status.cacheHitRate * 100).toFixed(1) + '%').padEnd(width - 20)}│`);
  } else {
    lines.push(`│ Run 'mcp daemon start' to begin${' '.repeat(Math.max(0, width - 36))}│`);
  }
  
  // Footer
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}

/**
 * Render health summary panel
 */
export function renderHealthPanel(
  metrics: DashboardMetrics,
  width: number = 45
): string[] {
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RESET = '\x1b[0m';
  
  const lines: string[] = [];
  
  // Header
  lines.push('┌─ SYSTEM HEALTH ─'.padEnd(width - 1, '─') + '┐');
  
  // Status indicator
  const serverStatus = metrics.failedServers === 0 
    ? `${GREEN}●${RESET} All Healthy` 
    : `${YELLOW}●${RESET} ${metrics.failedServers} Failed`;
  lines.push(`│ Servers: ${serverStatus.padEnd(width - 12)}│`);
  
  // Divider
  lines.push('│' + '─'.repeat(width - 2) + '│');
  
  // Metrics
  lines.push(`│ Total Tools: ${String(metrics.totalTools).padEnd(width - 17)}│`);
  lines.push(`│ Cached: ${String(metrics.cachedTools).padEnd(width - 12)}│`);
  lines.push(`│ Connected: ${String(metrics.connectedServers).padEnd(width - 15)}│`);
  lines.push(formatStatusLine('Avg Query Time', `${metrics.averageQueryTime.toFixed(0)}ms`, width - 3));
  lines.push('│' + lines[lines.length - 1].slice(1));
  
  // Footer
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}

/**
 * Render combined status view
 */
export function renderFullStatusPanel(
  daemonStatus: DaemonTUIStatus,
  metrics: DashboardMetrics,
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  // Two columns layout
  const colWidth = Math.floor((terminalWidth - 3) / 2);
  
  const daemonLines = renderDaemonStatusPanel(daemonStatus, colWidth);
  const healthLines = renderHealthPanel(metrics, colWidth);
  
  const maxLines = Math.max(daemonLines.length, healthLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const daemon = daemonLines[i] || ' '.repeat(colWidth + 1);
    const health = healthLines[i] || ' '.repeat(colWidth + 1);
    lines.push(daemon + ' ' + health);
  }
  
  return lines;
}

/**
 * Render a quick stats bar
 */
export function renderStatsBar(metrics: DashboardMetrics, width: number = 60): string {
  const parts = [
    `Tools: ${metrics.totalTools}`,
    `Cached: ${metrics.cachedTools}`,
    `Servers: ${metrics.connectedServers}`,
    `Cache Hit: ${(metrics.cacheHitRate * 100).toFixed(0)}%`,
  ];
  
  const joined = parts.join(' │ ');
  return '│ ' + joined.padEnd(width - 3) + '│';
}

/**
 * Create status badge
 */
export function createStatusBadge(
  label: string,
  status: 'success' | 'warning' | 'error' | 'info'
): string {
  const badges = {
    success: `[✓] ${label}`,
    warning: `[!] ${label}`,
    error: `[✕] ${label}`,
    info: `[i] ${label}`,
  };
  
  return badges[status];
}
