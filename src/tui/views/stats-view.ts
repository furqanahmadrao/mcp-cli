/**
 * Statistics View
 * 
 * Displays cache statistics, tool counts, and system metrics
 * with selectable list-based navigation
 */

import { DashboardMetrics } from '../types.js';

const BRIGHT_ORANGE = '\x1b[38;2;255;140;0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const INVERSE = '\x1b[7m';

/**
 * Stat item interface
 */
interface StatItem {
  label: string;
  value: string | number;
  status: 'ok' | 'warning' | 'error';
}

/**
 * Render statistics dashboard with selectable list
 */
export function renderStatsView(
  metrics: DashboardMetrics,
  width: number = 70,
  height: number = 24,
  selectedIndex: number = 0
): string[] {
  const lines: string[] = [];

  // Build stat items list
  const stats: StatItem[] = [
    {
      label: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate ? (metrics.cacheHitRate * 100).toFixed(1) : '0.0'}%`,
      status: metrics.cacheHitRate && metrics.cacheHitRate > 0.5 ? 'ok' : 'warning',
    },
    {
      label: 'Total Tools',
      value: metrics.totalTools,
      status: metrics.totalTools > 0 ? 'ok' : 'warning',
    },
    {
      label: 'Cached Tools',
      value: metrics.cachedTools,
      status: metrics.cachedTools > 0 ? 'ok' : 'warning',
    },
    {
      label: 'Connected Servers',
      value: metrics.connectedServers,
      status: metrics.connectedServers > 0 ? 'ok' : 'warning',
    },
    {
      label: 'Failed Servers',
      value: metrics.failedServers,
      status: metrics.failedServers === 0 ? 'ok' : 'error',
    },
    {
      label: 'Avg Query Time',
      value: `${metrics.averageQueryTime ? metrics.averageQueryTime.toFixed(2) : '0.00'}ms`,
      status: metrics.averageQueryTime && metrics.averageQueryTime < 100 ? 'ok' : 'warning',
    },
    {
      label: 'Daemon Memory',
      value: `${metrics.daemonMemory ? (metrics.daemonMemory / 1024 / 1024).toFixed(2) : '0.00'}MB`,
      status: 'ok',
    },
  ];

  // Header
  lines.push('');
  lines.push(`${BRIGHT_ORANGE}╔${'═'.repeat(width - 4)}╗${RESET}`);
  lines.push(`${BRIGHT_ORANGE}║ STATISTICS & METRICS (↑↓ arrow keys to navigate, Enter to view)${' '.repeat(Math.max(0, width - 68))}║${RESET}`);
  lines.push(`${BRIGHT_ORANGE}╠${'═'.repeat(width - 4)}╣${RESET}`);

  // Render stats list
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    const isSelected = i === selectedIndex;
    const statusDot = stat.status === 'ok' ? `${GREEN}●${RESET}` :
                      stat.status === 'warning' ? `${YELLOW}●${RESET}` :
                      `${RED}●${RESET}`;

    const prefix = isSelected ? `${INVERSE}▶${RESET} ` : '  ';
    const content = `${prefix}${statusDot} ${stat.label.padEnd(20)} ${BRIGHT_ORANGE}${stat.value}${RESET}`;
    
    const line = isSelected 
      ? `${BRIGHT_ORANGE}║${RESET}${INVERSE}${content.substring(0, width - 4)}${RESET}`.padEnd(width - 1)
      : `${BRIGHT_ORANGE}║${RESET}${content}`.padEnd(width - 1);
    
    lines.push(line + `${BRIGHT_ORANGE}║${RESET}`);
  }

  lines.push(`${BRIGHT_ORANGE}╠${'═'.repeat(width - 4)}╣${RESET}`);

  // Footer with legend
  lines.push(
    `${BRIGHT_ORANGE}║${RESET} ${GREEN}●${RESET} Healthy  ${YELLOW}●${RESET} Warning  ${RED}●${RESET} Error`.padEnd(width - 3) +
    `${BRIGHT_ORANGE}║${RESET}`
  );

  lines.push(`${BRIGHT_ORANGE}╚${'═'.repeat(width - 4)}╝${RESET}`);

  // Navigation hint
  lines.push('');
  lines.push(`${BRIGHT_ORANGE}[d] Dashboard  │  [s] Stats  │  [t] Tools  │  [m] Daemon  │  [h] Help  │  [q] Quit${RESET}`.padEnd(width - 2));

  return lines;
}

/**
 * Render mini stats panel
 */
export function renderMiniStats(
  metrics: DashboardMetrics,
  width: number = 70
): string[] {
  const cachePercent = metrics.cacheHitRate ? (metrics.cacheHitRate * 100).toFixed(0) : '0';
  const cachedPercent = metrics.cachedTools && metrics.totalTools 
    ? Math.round((metrics.cachedTools / metrics.totalTools) * 100)
    : 0;
  
  return [
    `${BRIGHT_ORANGE}Tools: ${metrics.totalTools}  │  Cached: ${cachedPercent}%  │  Servers: ${metrics.connectedServers}  │  Cache Hit: ${cachePercent}%${RESET}`
      .substring(0, width - 2)
      .padEnd(width - 2),
  ];
}
