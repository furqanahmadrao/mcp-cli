/**
 * TUI Theme and Styling System
 * 
 * Defines the orange + black professional color scheme and styling constants
 * for the terminal user interface.
 */

import { TUITheme } from '../types.js';

/**
 * Primary TUI theme - Orange + Black professional palette
 * Based on MCP CLI brand identity
 */
export const primaryTheme: TUITheme = {
  // Orange accent - Primary brand color
  primary: 'rgb(255, 140, 0)',    // Vibrant orange
  
  // Black/Dark - Secondary color
  secondary: 'rgb(20, 20, 20)',   // Very dark, almost black
  
  // Status colors
  success: 'rgb(0, 200, 0)',      // Green for success
  warning: 'rgb(255, 165, 0)',    // Amber for warnings
  error: 'rgb(255, 60, 60)',      // Red for errors
  
  // Text colors
  text: 'rgb(240, 240, 240)',     // Off-white text
  muted: 'rgb(120, 120, 120)',    // Gray for muted content
};

/**
 * Padding and spacing constants
 */
export const spacing = {
  xs: 1,      // 1 space
  sm: 2,      // 2 spaces
  md: 4,      // 4 spaces
  lg: 8,      // 8 spaces
  xl: 12,     // 12 spaces
};

/**
 * Box styles for UI boundaries
 */
export const boxStyles = {
  thin: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
  },
  thick: {
    top: '═',
    bottom: '═',
    left: '║',
    right: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  },
  rounded: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
  },
};

/**
 * Keyboard shortcut definitions
 */
export const keyboardShortcuts = {
  quit: { key: 'q', description: 'Quit application' },
  dashboard: { key: 'd', description: 'Go to dashboard' },
  tools: { key: 't', description: 'Go to tool list' },
  daemon: { key: 'm', description: 'Go to daemon control' },
  help: { key: 'h', description: 'Show this help' },
  refresh: { key: 'r', description: 'Refresh current view' },
  search: { key: '/', description: 'Search tools' },
  clearSearch: { key: 'Escape', description: 'Clear search' },
  up: { key: 'Up', description: 'Move up' },
  down: { key: 'Down', description: 'Move down' },
  enter: { key: 'Enter', description: 'Select/Execute' },
};

/**
 * ASCII art logo - MCP CLI Brand
 * Orange + Black design with full ASCII art rendering
 */
export const logoArt = [
  '╔═══════════════════════════════════════════════════╗',
  '║                                                   ║',
  '║     ███╗   ███╗ ██████╗██████╗     ██████╗██╗    ║',
  '║     ████╗ ████║██╔════╝██╔══██╗   ██╔════╝██║    ║',
  '║     ██╔████╔██║██║     ██████╔╝   ██║     ██║    ║',
  '║     ██║╚██╔╝██║██║     ██╔═══╝    ██║     ██║    ║',
  '║     ██║ ╚═╝ ██║╚██████╗██║         ██████╗██║    ║',
  '║     ╚═╝     ╚═╝ ╚═════╝╚═╝         ╚═════╝╚═╝    ║',
  '║                                                   ║',
  '║                 Model Context Protocol CLI        ║',
  '║                                                   ║',
  '╚═══════════════════════════════════════════════════╝',
];

/**
 * Format a shortcut help line
 */
export function formatShortcut(key: string, description: string): string {
  return `${key.padEnd(10)} → ${description}`;
}

/**
 * Create a bordered box around text
 */
export function createBox(
  content: string[],
  width: number = 50,
  style: keyof typeof boxStyles = 'rounded'
): string[] {
  const boxStyle = boxStyles[style];
  const result: string[] = [];
  
  // Top border
  result.push(
    boxStyle.topLeft +
    boxStyle.top.repeat(width - 2) +
    boxStyle.topRight
  );
  
  // Content lines
  for (const line of content) {
    const padding = width - line.length - 4;
    result.push(
      boxStyle.left +
      ' ' +
      line.padEnd(line.length + Math.max(0, padding)) +
      ' ' +
      boxStyle.right
    );
  }
  
  // Bottom border
  result.push(
    boxStyle.bottomLeft +
    boxStyle.bottom.repeat(width - 2) +
    boxStyle.bottomRight
  );
  
  return result;
}

/**
 * Create centered text in available width
 */
export function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}
