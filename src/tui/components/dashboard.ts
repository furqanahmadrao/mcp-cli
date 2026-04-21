/**
 * Dashboard Component
 * 
 * Main dashboard view showing daemon status, health metrics,
 * and navigation information.
 */

import { DaemonTUIStatus, DashboardMetrics } from '../types.js';
import {
  renderDaemonStatusPanel,
  renderHealthPanel,
  renderStatsBar,
} from './status-panel.js';
import {
  renderShortcutsBar,
  renderShortcutsPanel,
} from './shortcuts.js';
import {
  renderLogo,
  createHeaderWithLogo,
  renderCompactLogo,
} from './logo.js';

/**
 * Render full dashboard screen
 */
export function renderDashboard(
  daemonStatus: DaemonTUIStatus,
  metrics: DashboardMetrics,
  terminalWidth: number = 80,
  terminalHeight: number = 24,
  showFullLayout: boolean = true
): string[] {
  const lines: string[] = [];
  
  if (showFullLayout) {
    // Splash mode with full logo
    lines.push('');
    
    // Centered logo
    const logoLines = renderLogo();
    const logoWidth = Math.max(...logoLines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length));
    for (const line of logoLines) {
      const padding = Math.max(0, Math.floor((terminalWidth - logoWidth) / 2));
      lines.push(' '.repeat(padding) + line);
    }
    
    lines.push('');
    lines.push('─'.repeat(terminalWidth));
    lines.push('');
  } else {
    // Compact header
    const header = createHeaderWithLogo('Dashboard');
    lines.push(...header);
    lines.push('');
  }
  
  // Daemon status panel - left column
  const daemonLines = renderDaemonStatusPanel(daemonStatus, Math.floor((terminalWidth - 3) / 2));
  const healthLines = renderHealthPanel(metrics, Math.floor((terminalWidth - 3) / 2));
  
  // Combine two columns
  const statusLines = Math.max(daemonLines.length, healthLines.length);
  for (let i = 0; i < statusLines; i++) {
    const left = daemonLines[i] || ' '.repeat(Math.floor((terminalWidth - 3) / 2) + 1);
    const right = healthLines[i] || ' '.repeat(Math.floor((terminalWidth - 3) / 2) + 1);
    lines.push(left + ' ' + right);
  }
  
  lines.push('');
  
  // Quick stats bar
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  lines.push(renderStatsBar(metrics, terminalWidth));
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  lines.push('');
  
  // Shortcuts bar at bottom
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  lines.push(renderShortcutsBar(terminalWidth));
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Render compact dashboard (for narrow terminals)
 */
export function renderCompactDashboard(
  daemonStatus: DaemonTUIStatus,
  metrics: DashboardMetrics,
  terminalWidth: number = 60
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push(renderCompactLogo());
  lines.push('─'.repeat(terminalWidth));
  lines.push('');
  
  // Single column layout
  lines.push(...renderDaemonStatusPanel(daemonStatus, terminalWidth - 2));
  lines.push('');
  lines.push(...renderHealthPanel(metrics, terminalWidth - 2));
  lines.push('');
  
  // Quick stats
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  lines.push(renderStatsBar(metrics, terminalWidth));
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Create a simple text dashboard (for debugging)
 */
export function createTextDashboard(
  daemonStatus: DaemonTUIStatus,
  metrics: DashboardMetrics
): string {
  const parts = [
    `=== MCP CLI Dashboard ===`,
    ``,
    `Daemon Status:`,
    `  Running: ${daemonStatus.isRunning}`,
    `  PID: ${daemonStatus.pid || 'N/A'}`,
    `  Health: ${daemonStatus.healthStatus}`,
    `  Cached Tools: ${daemonStatus.cachedTools}`,
    `  Cache Hit Rate: ${(daemonStatus.cacheHitRate * 100).toFixed(1)}%`,
    ``,
    `System Health:`,
    `  Total Tools: ${metrics.totalTools}`,
    `  Cached: ${metrics.cachedTools}`,
    `  Connected Servers: ${metrics.connectedServers}`,
    `  Failed Servers: ${metrics.failedServers}`,
    `  Avg Query Time: ${metrics.averageQueryTime.toFixed(0)}ms`,
    ``,
    `Use keyboard shortcuts to navigate (h for help)`,
  ];
  
  return parts.join('\n');
}

/**
 * Create welcome screen
 */
export function renderWelcomeScreen(terminalWidth: number = 80): string[] {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  
  const centerLine = (text: string) => {
    const padding = Math.floor((terminalWidth - text.length - 2) / 2);
    return '│' + ' '.repeat(padding) + text + ' '.repeat(Math.max(0, terminalWidth - text.length - padding - 2)) + '│';
  };
  
  lines.push(centerLine('Welcome to MCP CLI'));
  lines.push(centerLine(''));
  lines.push(centerLine('Model Context Protocol Manager'));
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  lines.push('');
  lines.push('Getting started:');
  lines.push('  • View dashboard with daemon status and metrics');
  lines.push('  • Manage MCP servers from the daemon control panel');
  lines.push('  • Browse and search available tools');
  lines.push('  • Check server health and performance');
  lines.push('');
  lines.push('Press any key to continue...');
  
  return lines;
}

/**
 * Render error/alert message
 */
export function renderAlert(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' = 'info',
  terminalWidth: number = 60
): string[] {
  const lines: string[] = [];
  
  const icons = {
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
  };
  
  const icon = icons[type];
  
  // Top border
  lines.push('╭' + '─'.repeat(terminalWidth - 2) + '╮');
  
  // Title
  lines.push('│ ' + `${icon} ${title}`.padEnd(terminalWidth - 3) + '│');
  
  // Content border
  lines.push('├' + '─'.repeat(terminalWidth - 2) + '┤');
  
  // Message (word wrapped)
  const words = message.split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length <= terminalWidth - 4) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push('│ ' + currentLine.padEnd(terminalWidth - 3) + '│');
      currentLine = word;
    }
  }
  if (currentLine) lines.push('│ ' + currentLine.padEnd(terminalWidth - 3) + '│');
  
  // Bottom border
  lines.push('╰' + '─'.repeat(terminalWidth - 2) + '╯');
  
  return lines;
}
