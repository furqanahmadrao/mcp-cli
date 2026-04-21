/**
 * Servers Management View - Add/Remove MCP Servers
 */

import { BRIGHT_ORANGE, GREEN, YELLOW, RED, RESET, BOLD, INVERSE } from '../theme.js';
import { ServerConfig } from '../services/config-service.js';

/**
 * Render servers management view content (without header)
 */
export function renderServersView(
  servers: ServerConfig[],
  selectedIndex: number = 0,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(width, 100);

  lines.push(`  ${BOLD}${BRIGHT_ORANGE}CONFIGURED SERVERS (${servers.length})${RESET}`);
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push('');

  if (servers.length === 0) {
    lines.push(`  ${YELLOW}⚠ No servers configured.${RESET}`);
    lines.push(`    Go back to the Manage menu to add your first server.`);
  }

  // List servers
  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];
    const isSelected = i === selectedIndex;

    const statusDot = `${GREEN}●${RESET}`; 

    const prefix = isSelected ? `${INVERSE} ▶ ${RESET} ` : '   ';
    const name = `${server.name}`.padEnd(15);
    const command = server.type === 'stdio' ? server.command : server.url;

    const line = `${prefix}${statusDot}  ${name}  → ${command}`;

    if (isSelected) {
      lines.push(`${BOLD}${BRIGHT_ORANGE}${line.padEnd(effectiveWidth - 4)}${RESET}`);
    } else {
      lines.push(line.substring(0, effectiveWidth - 4).padEnd(effectiveWidth - 4));
    }
  }

  lines.push('');
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  
  const footer = '↑↓: Navigate │ Enter: Edit │ Esc: Back';
  const footerPadding = Math.max(0, Math.floor((effectiveWidth - footer.length) / 2));
  lines.push(' '.repeat(footerPadding) + footer);

  return lines;
}
