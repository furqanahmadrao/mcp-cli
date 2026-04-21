/**
 * ASCII Art Logo and Header Component
 * 
 * Renders the MCP CLI logo and unified header for all views.
 */

import { BRIGHT_ORANGE, BOLD, RESET } from '../theme.js';

const LOGO_ART = [
  '███╗   ███╗ ██████╗██████╗      ██████╗██╗     ██╗',
  '████╗ ████║██╔════╝██╔══██╗    ██╔════╝██║     ██║',
  '██╔████╔██║██║     ██████╔╝    ██║     ██║     ██║',
  '██║╚██╔╝██║██║     ██╔═══╝     ██║     ██║     ██║',
  '██║ ╚═╝ ██║╚██████╗██║         ╚██████╗███████╗██║',
  '╚═╝     ╚═╝ ╚═════╝╚═╝          ╚═════╝╚══════╝╚═╝',
];

/**
 * Render the unified header with logo and title
 */
export function renderHeader(title: string, width: number): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(width, 100);
  
  // Logo dimensions
  const logoWidth = 50; 
  const padding = Math.max(0, Math.floor((effectiveWidth - logoWidth - 4) / 2));
  
  // Top border
  lines.push('╔' + '═'.repeat(effectiveWidth - 2) + '╗');
  
  // Logo with side borders
  for (const line of LOGO_ART) {
    const content = line.padEnd(logoWidth);
    const leftPadding = ' '.repeat(padding);
    const rightPadding = ' '.repeat(Math.max(0, effectiveWidth - padding - logoWidth - 4));
    lines.push('║' + leftPadding + ' ' + content + ' ' + rightPadding + '║');
  }
  
  // Title section
  const tagline = 'Model Context Protocol - Terminal Manager';
  const tagPadding = Math.max(0, Math.floor((effectiveWidth - tagline.length - 2) / 2));
  lines.push('║' + ' '.repeat(tagPadding) + tagline + ' '.repeat(Math.max(0, effectiveWidth - tagPadding - tagline.length - 2)) + '║');
  
  lines.push('╠' + '═'.repeat(effectiveWidth - 2) + '╣');
  
  // View Title
  const titlePadding = Math.max(0, Math.floor((effectiveWidth - title.length - 2) / 2));
  lines.push('║' + ' '.repeat(titlePadding) + BOLD + title + RESET + BRIGHT_ORANGE + ' '.repeat(Math.max(0, effectiveWidth - titlePadding - title.length - 2)) + '║');
  
  // Bottom border
  lines.push('╚' + '═'.repeat(effectiveWidth - 2) + '╝');

  return lines.map(line => BRIGHT_ORANGE + line + RESET);
}

/**
 * Legacy renderLogo for compatibility if needed
 */
export function renderLogo(): string[] {
  return LOGO_ART.map(line => BRIGHT_ORANGE + line + RESET);
}
