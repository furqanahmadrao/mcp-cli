/**
 * Keyboard Parser
 * 
 * Converts raw keyboard input (including ANSI escape sequences)
 * to human-readable key names for terminal UI handling.
 */

export interface ParsedKey {
  name: string;
  raw: string;
  isArrow: boolean;
  isCtrlPressed: boolean;
  isAltPressed: boolean;
}

/**
 * Parse raw keyboard input from stdin
 * 
 * Handles:
 * - Arrow keys: \x1b[A (up), \x1b[B (down), \x1b[C (right), \x1b[D (left)
 * - Enter: \r or \n
 * - Escape: \x1b (standalone)
 * - Tab: \t
 * - Backspace: \x7f or \x08
 * - Regular characters: a-z, A-Z, 0-9, etc
 * - Ctrl combinations: \x01-\x1a (ctrl+a through ctrl+z)
 */
export function parseKeypress(buffer: string): ParsedKey | null {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  const raw = buffer;
  
  // Check for Enter key BEFORE trimming (so we catch \r and \n)
  if (buffer === '\r' || buffer === '\n' || buffer === '\r\n') {
    return {
      name: 'enter',
      raw,
      isArrow: false,
      isCtrlPressed: false,
      isAltPressed: false,
    };
  }

  // Strip trailing whitespace (carriage returns, etc) for other keys
  const trimmedBuffer = buffer.replace(/[\r\n\t ]*$/, '');
  if (!trimmedBuffer || trimmedBuffer.length === 0) {
    return null;
  }

  let name = '';
  let isArrow = false;
  let isCtrlPressed = false;
  let isAltPressed = false;

  // Check for ANSI escape sequences (arrow keys, etc)
  if (trimmedBuffer.startsWith('\x1b')) {
    // Arrow keys: ESC [ X
    if (trimmedBuffer.length >= 3 && trimmedBuffer[1] === '[') {
      const key = trimmedBuffer[2];
      switch (key) {
        case 'A':
          name = 'arrowup';
          isArrow = true;
          break;
        case 'B':
          name = 'arrowdown';
          isArrow = true;
          break;
        case 'C':
          name = 'arrowright';
          isArrow = true;
          break;
        case 'D':
          name = 'arrowleft';
          isArrow = true;
          break;
        case 'H':
          name = 'home';
          break;
        case 'F':
          name = 'end';
          break;
        default:
          // Check for extended sequences like delete key (\x1b[3~)
          if (trimmedBuffer.length >= 4 && trimmedBuffer[2] === '3' && trimmedBuffer[3] === '~') {
            name = 'delete';
          } else if (trimmedBuffer.includes('~')) {
            // Other function keys (F1-F12, etc)
            name = 'function-key';
          } else {
            // Unknown escape sequence
            name = 'escape';
          }
      }
    } else if (trimmedBuffer.length === 1) {
      // Escape key pressed alone
      name = 'escape';
    } else {
      // Alt modifier combinations (ESC prefix)
      isAltPressed = true;
      // Handle the character after ESC
      if (trimmedBuffer.length >= 2) {
        const char = trimmedBuffer[1];
        if (char >= 'a' && char <= 'z') {
          name = `alt+${char}`;
        } else {
          name = 'alt-key';
        }
      }
    }
  } 
  // Tab key
  else if (trimmedBuffer === '\t') {
    name = 'tab';
  } 
  // Backspace
  else if (trimmedBuffer === '\x7f' || trimmedBuffer === '\x08') {
    name = 'backspace';
  } 
  // Ctrl combinations (Ctrl+A through Ctrl+Z)
  else if (trimmedBuffer.charCodeAt(0) <= 26 && trimmedBuffer.charCodeAt(0) > 0) {
    isCtrlPressed = true;
    const charCode = trimmedBuffer.charCodeAt(0) + 96; // Convert to a-z
    name = `ctrl+${String.fromCharCode(charCode)}`;
  } 
  // Regular printable character
  else if (trimmedBuffer.length === 1) {
    name = trimmedBuffer;
  } 
  // Unknown multi-byte sequence
  else {
    name = trimmedBuffer;
  }

  return {
    name,
    raw,
    isArrow,
    isCtrlPressed,
    isAltPressed,
  };
}

/**
 * Check if parsed key is an arrow key
 */
export function isArrowKey(parsed: ParsedKey): boolean {
  return parsed.isArrow || 
         parsed.name === 'arrowup' || 
         parsed.name === 'arrowdown' || 
         parsed.name === 'arrowleft' || 
         parsed.name === 'arrowright';
}

/**
 * Check if parsed key is a navigation key
 */
export function isNavigationKey(parsed: ParsedKey): boolean {
  return isArrowKey(parsed) || 
         parsed.name === 'home' || 
         parsed.name === 'end' ||
         parsed.name === 'enter' ||
         parsed.name === 'escape' ||
         parsed.name === 'tab';
}
