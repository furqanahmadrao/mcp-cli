/**
 * Update View - Version Management & Updates
 * 
 * Shows current version and allows checking for updates
 */

import { BRIGHT_ORANGE, GREEN, YELLOW, RESET, BOLD } from '../theme.js';

const CURRENT_VERSION = '1.0.0-beta.1';
const LATEST_VERSION = '1.0.0';
const HAS_UPDATE = true; // Indicate if update is available

/**
 * Render update/version view content (without header)
 */
export function renderUpdateView(
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(width, 100);

  // Current version info
  lines.push(`  ${BOLD}Current Version:${RESET}  ${BRIGHT_ORANGE}v${CURRENT_VERSION}${RESET}`);
  lines.push('');

  // Update status
  if (HAS_UPDATE) {
    lines.push(`  ${YELLOW}⚠ Update Available:${RESET}  ${GREEN}v${LATEST_VERSION}${RESET}`);
    lines.push('');
    lines.push(`  ${BOLD}To update, run:${RESET}`);
    lines.push(`  ${BRIGHT_ORANGE}npm install -g @mcp/cli@latest${RESET}`);
  } else {
    lines.push(`  ${GREEN}✓ System up to date${RESET}`);
    lines.push('');
    lines.push('  You are running the latest stable version of MCP CLI.');
  }

  lines.push('');
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push('');

  // Release notes
  lines.push(`  ${BOLD}${BRIGHT_ORANGE}LATEST RELEASE NOTES${RESET}`);
  lines.push('');
  lines.push('    - Unified TUI/CLI configuration system');
  lines.push('    - Responsive rendering for various terminal sizes');
  lines.push('    - Improved MCP server discovery resilience');
  lines.push('    - Enhanced diagnostic tools (Doctor view)');
  lines.push('');
  
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push('');
  
  const footer = '↑↓: Navigate │ Esc: Back';
  const footerPadding = Math.max(0, Math.floor((effectiveWidth - footer.length) / 2));
  lines.push(BRIGHT_ORANGE + ' '.repeat(footerPadding) + footer + RESET);

  return lines;
}
