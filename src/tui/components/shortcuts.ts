/**
 * Keyboard Shortcuts Component
 * 
 * Displays keyboard shortcuts and navigation help in the TUI.
 */

import { BRIGHT_ORANGE, BOLD, RESET, GREEN, YELLOW, INVERSE, CYAN } from '../theme.js';

/**
 * Render help screen content (structured and beautiful)
 */
export function renderHelpScreen(terminalWidth: number = 80, terminalHeight: number = 24): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(terminalWidth, 100);
  const colWidth = Math.floor((effectiveWidth - 8) / 2);
  
  lines.push('');
  
  // Section 1: Navigation & Basics (Two columns)
  lines.push(`  ${BOLD}${CYAN}⌨  NAVIGATION BASICS${RESET}`.padEnd(colWidth + 4) + `${BOLD}${CYAN}📋 MAIN MENU GUIDE${RESET}`);
  lines.push(`  ${CYAN}${'─'.repeat(colWidth)}${RESET}`.padEnd(colWidth + 4 + (CYAN.length + RESET.length)) + `${CYAN}${'─'.repeat(colWidth)}${RESET}`);
  
  const navItems = [
    ['↑ ↓ arrows', 'Move selection'],
    ['Enter', 'Select / Action'],
    ['Escape', 'Go Back'],
    ['Q key', 'Exit Application']
  ];
  
  const menuItems = [
    ['Manage', 'Server Setup'],
    ['Doctor', 'Diagnostics'],
    ['Update', 'Software Version'],
    ['Help', 'Documentation']
  ];
  
  for (let i = 0; i < 4; i++) {
    const nav = `  ${BRIGHT_ORANGE}${navItems[i][0].padEnd(12)}${RESET} ${navItems[i][1]}`;
    const menu = `  ${BRIGHT_ORANGE}${menuItems[i][0].padEnd(12)}${RESET} ${menuItems[i][1]}`;
    lines.push(nav.padEnd(colWidth + 4 + (BRIGHT_ORANGE.length + RESET.length)) + menu);
  }
  
  lines.push('');
  
  // Section 2: Server Management (Full width box)
  lines.push(`  ${BOLD}${GREEN}⚙  SERVER MANAGEMENT${RESET}`);
  lines.push(`  ${GREEN}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push(`    Navigate to ${BOLD}Manage${RESET} → ${BOLD}MCP Servers${RESET} to see your configured servers.`);
  lines.push(`    • To ${BOLD}Add${RESET} a server: Select 'Add MCP Server' from the Manage menu.`);
  lines.push(`    • To ${BOLD}Edit/Remove${RESET}: Navigate to the server list, select a server, and press ${BOLD}Enter${RESET}.`);
  lines.push('');
  
  // Section 3: System & About
  lines.push(`  ${BOLD}${YELLOW}ℹ  SYSTEM INFORMATION${RESET}`);
  lines.push(`  ${YELLOW}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push(`    MCP CLI acts as a bridge between your local environment and AI models.`);
  lines.push(`    It supports ${BOLD}stdio${RESET} (local scripts) and ${BOLD}http${RESET} (remote services) transports.`);
  lines.push('');
  
  // Footer area
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  const repo = `Source: https://github.com/furqan/mcp-cli`;
  lines.push(' '.repeat(effectiveWidth - repo.length - 2) + `${DIM}${repo}${RESET}`);
  
  lines.push('');
  const footer = `${INVERSE} ↑↓ Navigate │ Esc Back │ Q Quit ${RESET}`;
  const footerPadding = Math.max(0, Math.floor((effectiveWidth - 36) / 2));
  lines.push(' '.repeat(footerPadding) + footer);

  return lines;
}

/**
 * Render minimal shortcuts bar
 */
export function renderShortcutsBar(width: number = 80): string {
  const shortcuts = ['↑↓=Navigate', 'Enter=Select', 'Esc=Back', 'q=Quit'];
  const joined = shortcuts.join(' │ ');
  return '│ ' + joined.padEnd(width - 3) + '│';
}
