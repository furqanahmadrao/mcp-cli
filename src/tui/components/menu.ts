/**
 * Main Menu Component
 * 
 * Responsive menu system that adapts to terminal width.
 */

import { BRIGHT_ORANGE, BOLD, RESET } from '../theme.js';

export interface MenuItem {
  id: string;
  label: string;
  description: string;
  submenu?: string;
}

export const mainMenuItems: MenuItem[] = [
  {
    id: 'manage-servers',
    label: 'Manage',
    description: 'Add, remove, or update servers',
    submenu: 'servers',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'System diagnosis and health check',
  },
  {
    id: 'update',
    label: 'Update',
    description: 'Check and install updates',
  },
  {
    id: 'help',
    label: 'Help',
    description: 'Keyboard shortcuts and info',
  },
  {
    id: 'quit',
    label: 'Quit',
    description: 'Exit MCP CLI',
  },
];

export const serversMenuItems: MenuItem[] = [
  {
    id: 'add-server',
    label: 'Add MCP Server',
    description: 'Register a new MCP server',
  },
  {
    id: 'remove-server',
    label: 'Remove MCP Server',
    description: 'Unregister an existing server',
  },
  {
    id: 'update-server',
    label: 'Update MCP Server',
    description: 'Modify server configuration',
  },
  {
    id: 'back',
    label: 'Back to Main Menu',
    description: 'Return to main menu',
  },
];

/**
 * Render menu screen content (without header)
 */
export function renderMenu(
  selectedIndex: number = 0,
  width: number = 80,
  height: number = 24,
  menuLevel: 'main' | 'servers' = 'main'
): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(width, 100);

  const items = menuLevel === 'servers' ? serversMenuItems : mainMenuItems;

  // Menu items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isSelected = i === selectedIndex;
    const arrow = isSelected ? '▶' : ' ';
    const label = item.label.padEnd(20);
    const desc = item.description;
    
    let line = `  ${arrow} ${BOLD}${label}${RESET} ${desc}`;
    // Ensure line fits
    const rawLength = line.replace(/\x1b\[[0-9;]*m/g, '').length;
    if (rawLength > effectiveWidth - 2) {
      line = line.substring(0, effectiveWidth + 20); 
    }
    
    lines.push(isSelected ? BRIGHT_ORANGE + line + RESET : line);
  }

  lines.push('');
  lines.push(BRIGHT_ORANGE + '═'.repeat(effectiveWidth) + RESET);
  
  const footer = '↑↓: Navigate │ Enter: Select │ q: Quit';
  const footerPadding = Math.max(0, Math.floor((effectiveWidth - footer.length) / 2));
  lines.push(BRIGHT_ORANGE + ' '.repeat(footerPadding) + footer + RESET);

  return lines;
}

export function getMenuItemById(id: string, level: 'main' | 'servers' = 'main'): MenuItem | undefined {
  const items = level === 'servers' ? serversMenuItems : mainMenuItems;
  return items.find(item => item.id === id);
}

export function getMenuItemAtIndex(index: number, level: 'main' | 'servers' = 'main'): MenuItem | undefined {
  const items = level === 'servers' ? serversMenuItems : mainMenuItems;
  return items[index];
}

export function getMenuItemsCount(level: 'main' | 'servers' = 'main'): number {
  const items = level === 'servers' ? serversMenuItems : mainMenuItems;
  return items.length;
}
