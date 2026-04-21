/**
 * TUI Theme - ANSI Color Codes
 * 
 * Centralized color definitions for consistent theming
 */

// Text Styles
export const RESET = '\x1b[0m';      // Clear all formatting
export const BOLD = '\x1b[1m';       // Bold text
export const DIM = '\x1b[2m';        // Dimmed text
export const ITALIC = '\x1b[3m';     // Italic text
export const UNDERLINE = '\x1b[4m';  // Underlined text
export const INVERSE = '\x1b[7m';    // Inverse colors

// Colors (RGB - 24-bit true color)
export const BRIGHT_ORANGE = '\x1b[38;2;255;140;0m';  // #FF8C00 - Primary theme
export const GREEN = '\x1b[32m';                        // System green
export const RED = '\x1b[31m';                          // System red
export const YELLOW = '\x1b[33m';                       // System yellow
export const BLUE = '\x1b[34m';                         // System blue
export const CYAN = '\x1b[36m';                         // System cyan
export const WHITE = '\x1b[37m';                        // System white
export const GRAY = '\x1b[90m';                         // Bright black
export const DARK_GRAY = '\x1b[38;2;100;100;100m';     // Dark gray

// Background Colors
export const BG_ORANGE = '\x1b[48;2;255;140;0m';       // Orange background
export const BG_RED = '\x1b[41m';                       // Red background
export const BG_GREEN = '\x1b[42m';                     // Green background
export const BG_YELLOW = '\x1b[43m';                    // Yellow background
export const BG_BLUE = '\x1b[44m';                      // Blue background
export const BG_DARK = '\x1b[48;2;30;30;30m';          // Dark background

// Common Combinations
export const HEADER = BRIGHT_ORANGE + BOLD;
export const ERROR = RED;
export const SUCCESS = GREEN;
export const WARNING = YELLOW;
export const INFO = CYAN;
export const MUTED = GRAY;

/**
 * Apply styling to text
 */
export function styled(text: string, style: string): string {
  return style + text + RESET;
}

/**
 * Clear screen
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * Move cursor to position
 */
export function moveCursor(row: number, col: number): void {
  process.stdout.write(`\x1b[${row};${col}H`);
}

/**
 * Hide cursor
 */
export function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

/**
 * Show cursor
 */
export function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}
