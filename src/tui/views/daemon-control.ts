/**
 * Daemon Control Panel Component
 * 
 * Interactive panel for controlling the MCP daemon service.
 */

import { DaemonTUIStatus } from '../types.js';
import { renderDaemonStatusPanel } from '../components/status-panel.js';
import { renderButtonGroup } from '../components/button.js';

/**
 * Render daemon control panel with action buttons
 */
export function renderDaemonControlPanel(
  status: DaemonTUIStatus,
  selectedAction: number = 0,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' DAEMON CONTROL'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Status panel
  const statusLines = renderDaemonStatusPanel(status, Math.floor((width - 3) / 2));
  for (const line of statusLines) {
    const padded = line.padEnd(width - 2);
    lines.push('║' + padded.substring(0, width - 2) + '║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Actions available based on status
  let actions: string[] = [];
  if (status.isRunning) {
    actions = ['Stop', 'Restart', 'View Logs', 'Back'];
  } else {
    actions = ['Start', 'View Logs', 'Back'];
  }
  
  // Action buttons
  const buttonLines = renderButtonGroup(actions, selectedAction, width - 2);
  for (const line of buttonLines) {
    lines.push('║ ' + line.padEnd(width - 4) + ' ║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Recent logs section
  lines.push('║ RECENT LOGS:'.padEnd(width - 1) + '║');
  
  const maxLogs = Math.min(height - 16, 8);
  const dummyLogs = [
    '✓ Daemon started successfully',
    '✓ Cache manager initialized',
    '✓ Health poller started',
    'ℹ Discovery cache updated',
    'ℹ Tool count: 45',
  ];
  
  for (let i = 0; i < maxLogs && i < dummyLogs.length; i++) {
    const log = dummyLogs[i].substring(0, width - 6);
    lines.push('║ ' + log.padEnd(width - 4) + ' ║');
  }
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Center text within a given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Render daemon startup wizard
 */
export function renderDaemonStartupWizard(
  step: number = 1, // 1=confirm, 2=starting, 3=complete
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + centerText('START DAEMON', width - 2) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  if (step === 1) {
    lines.push('║ Ready to start the MCP daemon?'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ This will:'.padEnd(width - 1) + '║');
    lines.push('║   • Initialize the daemon service'.padEnd(width - 1) + '║');
    lines.push('║   • Start background processes'.padEnd(width - 1) + '║');
    lines.push('║   • Cache tool definitions'.padEnd(width - 1) + '║');
    lines.push('║   • Enable health monitoring'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ [Confirm]              [Cancel]'.padEnd(width - 1) + '║');
  } else if (step === 2) {
    lines.push('║ Starting daemon...'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ ◐ Initializing...'.padEnd(width - 1) + '║');
    lines.push('║ ✓ Configuration loaded'.padEnd(width - 1) + '║');
    lines.push('║ ○ Cache initialization'.padEnd(width - 1) + '║');
    lines.push('║ ○ Health monitoring'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
  } else if (step === 3) {
    lines.push('║ ✓ Daemon Started Successfully!'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ Status: Running'.padEnd(width - 1) + '║');
    lines.push('║ PID: 12345'.padEnd(width - 1) + '║');
    lines.push('║ Uptime: 2 seconds'.padEnd(width - 1) + '║');
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ [OK]'.padEnd(width - 1) + '║');
  }
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render daemon logs view
 */
export function renderDaemonLogsView(
  logs: string[],
  selectedAction: number = 0,
  width: number = 80,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' DAEMON LOGS'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  const maxLogs = Math.min(height - 8, 15);
  const displayLogs = logs.slice(Math.max(0, logs.length - maxLogs));
  
  for (const log of displayLogs) {
    const content = log.substring(0, width - 4);
    lines.push('║ ' + content.padEnd(width - 4) + ' ║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  const buttons = ['Clear', 'Export', 'Back'];
  const buttonLine = buttons.map((btn, idx) => {
    const prefix = idx === selectedAction ? '▶' : ' ';
    return `${prefix}[${btn}]`;
  }).join('  ');
  
  lines.push('║ ' + buttonLine.padEnd(width - 4) + ' ║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}
