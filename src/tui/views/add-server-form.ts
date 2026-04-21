/**
 * Add Server Form View
 * 
 * Interactive form to add a new MCP server
 */

import { BRIGHT_ORANGE, GREEN, RED, YELLOW, RESET, BOLD } from '../theme.js';

export interface AddServerFormState {
  name: string;
  nameError: string;
  type: 'stdio' | 'http';
  command: string;
  commandError: string;
  url: string;
  urlError: string;
  focusedField: 'name' | 'type' | 'command' | 'url' | 'auth' | 'submit';
  nameInputCursor: number;
  commandInputCursor: number;
  urlInputCursor: number;
  authType: 'none' | 'bearer' | 'oauth' | 'api-key';
  bearerToken: string;
  bearerTokenCursor: number;
  submitted: boolean;
}

/**
 * Render add server form
 */
export function renderAddServerForm(state: AddServerFormState): string[] {
  const lines: string[] = [];
  const width = 72;

  // Title
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push(
    '║ ' +
    BRIGHT_ORANGE + BOLD + 'ADD NEW SERVER' + RESET +
    ' '.repeat(width - 18) +
    '║'
  );
  lines.push('╠' + '═'.repeat(width - 2) + '╣');

  // Server Name
  lines.push('');
  const nameFocus = state.focusedField === 'name';
  const namePrefix = nameFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
  lines.push(namePrefix + BRIGHT_ORANGE + BOLD + 'Server Name' + RESET);
  if (state.nameError) {
    lines.push('  ' + RED + '✗ ' + state.nameError + RESET);
  }
  const nameDisplay = renderTextInput(state.name, state.nameInputCursor, 60);
  lines.push('  ' + BRIGHT_ORANGE + nameDisplay + RESET);
  lines.push('');

  // Server Type
  const typeFocus = state.focusedField === 'type';
  const typePrefix = typeFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
  lines.push(typePrefix + BRIGHT_ORANGE + BOLD + 'Server Type' + RESET);
  lines.push(
    '  ' +
    BRIGHT_ORANGE +
    `[${state.type}]             (← →  to change)` +
    RESET
  );
  if (state.type === 'stdio') {
    lines.push('  ' + GREEN + '✓ stdio  - Local process');
  } else {
    lines.push('    http   - HTTP API');
  }
  if (state.type === 'http') {
    lines.push('  ' + GREEN + '✓ http   - HTTP API');
  } else {
    lines.push('    stdio  - Local process');
  }
  lines.push('');

  // Command (stdio) or URL (http)
  if (state.type === 'stdio') {
    const cmdFocus = state.focusedField === 'command';
    const cmdPrefix = cmdFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
    lines.push(cmdPrefix + BRIGHT_ORANGE + BOLD + 'Command' + RESET);
    if (state.commandError) {
      lines.push('  ' + RED + '✗ ' + state.commandError + RESET);
    }
    const cmdDisplay = renderTextInput(state.command, state.commandInputCursor, 60);
    lines.push('  ' + BRIGHT_ORANGE + cmdDisplay + RESET);
  } else {
    const urlFocus = state.focusedField === 'url';
    const urlPrefix = urlFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
    lines.push(urlPrefix + BRIGHT_ORANGE + BOLD + 'URL' + RESET);
    if (state.urlError) {
      lines.push('  ' + RED + '✗ ' + state.urlError + RESET);
    }
    const urlDisplay = renderTextInput(state.url, state.urlInputCursor, 60);
    lines.push('  ' + BRIGHT_ORANGE + urlDisplay + RESET);
  }
  lines.push('');

  // Authentication
  const authFocus = state.focusedField === 'auth';
  const authPrefix = authFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
  lines.push(authPrefix + BRIGHT_ORANGE + BOLD + 'Authentication' + RESET);
  lines.push(`  ${BRIGHT_ORANGE}[${state.authType}]            (← → to change)${RESET}`);
  const authOptions = ['none', 'bearer', 'oauth', 'api-key'];
  authOptions.forEach(opt => {
    if (opt === state.authType) {
      lines.push(`  ${GREEN}✓ ${opt}`);
    } else {
      lines.push(`    ${opt}`);
    }
  });
  lines.push('');

  // Bearer token (if selected)
  if (state.authType === 'bearer') {
    const tokenFocus = state.focusedField === 'auth'; // editing token while in auth field
    const tokenPrefix = tokenFocus ? BRIGHT_ORANGE + '▶ ' + RESET : '  ';
    lines.push(tokenPrefix + BRIGHT_ORANGE + BOLD + 'Bearer Token' + RESET);
    const tokenDisplay = renderTextInput(state.bearerToken, state.bearerTokenCursor, 60, true);
    lines.push('  ' + BRIGHT_ORANGE + tokenDisplay + RESET);
  }

  lines.push('');
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  lines.push('');

  // Instructions
  if (state.focusedField === 'submit') {
    lines.push(YELLOW + BOLD + 'Ready to add server?' + RESET);
    lines.push(GREEN + '✓ Add  ' + RESET + '  Cancel (Esc)');
  } else {
    lines.push(
      BRIGHT_ORANGE +
      'Tab' +
      RESET +
      ' to move | ' +
      BRIGHT_ORANGE +
      'Enter' +
      RESET +
      ' to submit | ' +
      BRIGHT_ORANGE +
      'Esc' +
      RESET +
      ' to cancel'
    );
  }

  return lines;
}

/**
 * Render text input with cursor
 */
function renderTextInput(
  value: string,
  cursor: number,
  maxWidth: number = 60,
  masked: boolean = false
): string {
  const visible = value.substring(0, cursor);
  const afterCursor = value.substring(cursor);
  const cursorChar = afterCursor.length > 0 ? '▌' : '_';

  if (masked) {
    return (
      '●'.repeat(visible.length) +
      cursorChar +
      '●'.repeat(afterCursor.length)
    );
  }

  return visible + cursorChar + afterCursor;
}

/**
 * Handle keyboard input in add server form
 */
export function handleAddServerFormInput(
  state: AddServerFormState,
  key: string
): { state: AddServerFormState; action?: string } {
  // Navigation
  if (key === 'tab') {
    const fields = ['name', 'type', 'command', 'url', 'auth', 'submit'];
    let idx = fields.indexOf(state.focusedField);
    idx = (idx + 1) % fields.length;
    state.focusedField = fields[idx] as any;
    return { state };
  }

  if (key === 'shift+tab') {
    const fields = ['name', 'type', 'command', 'url', 'auth', 'submit'];
    let idx = fields.indexOf(state.focusedField);
    idx = (idx - 1 + fields.length) % fields.length;
    state.focusedField = fields[idx] as any;
    return { state };
  }

  // Submit
  if (state.focusedField === 'submit' && key === 'enter') {
    return validateAddServerForm(state);
  }

  if (key === 'escape') {
    return { state, action: 'cancel' };
  }

  // Text inputs
  if (state.focusedField === 'name') {
    state.nameError = '';
    handleTextInput(key, state, 'name', 50);
  } else if (state.focusedField === 'type') {
    if (key === 'arrowleft' || key === 'arrowright') {
      state.type = state.type === 'stdio' ? 'http' : 'stdio';
    }
  } else if (state.focusedField === 'command') {
    state.commandError = '';
    handleTextInput(key, state, 'command', 60);
  } else if (state.focusedField === 'url') {
    state.urlError = '';
    handleTextInput(key, state, 'url', 60);
  } else if (state.focusedField === 'auth') {
    if (state.authType === 'bearer') {
      handleTextInput(key, state, 'bearerToken', 60);
    } else {
      handleAuthTypeInput(key, state);
    }
  }

  return { state };
}

/**
 * Handle text input editing
 */
function handleTextInput(
  key: string,
  state: AddServerFormState,
  field: string,
  maxLen?: number
): void {
  let value: string;
  let cursor: number;

  if (field === 'name') {
    value = state.name;
    cursor = state.nameInputCursor;
  } else if (field === 'command') {
    value = state.command;
    cursor = state.commandInputCursor;
  } else if (field === 'url') {
    value = state.url;
    cursor = state.urlInputCursor;
  } else if (field === 'bearerToken') {
    value = state.bearerToken;
    cursor = state.bearerTokenCursor;
  } else {
    return;
  }

  if (key === 'arrowleft') {
    cursor = Math.max(0, cursor - 1);
  } else if (key === 'arrowright') {
    cursor = Math.min(value.length, cursor + 1);
  } else if (key === 'home') {
    cursor = 0;
  } else if (key === 'end') {
    cursor = value.length;
  } else if (key === 'backspace') {
    if (cursor > 0) {
      value = value.substring(0, cursor - 1) + value.substring(cursor);
      cursor--;
    }
  } else if (key === 'delete') {
    if (cursor < value.length) {
      value = value.substring(0, cursor) + value.substring(cursor + 1);
    }
  } else if (key.length === 1 && key >= ' ' && key <= '~') {
    if (!maxLen || value.length < maxLen) {
      value = value.substring(0, cursor) + key + value.substring(cursor);
      cursor++;
    }
  }

  // Update state
  if (field === 'name') {
    state.name = value;
    state.nameInputCursor = cursor;
  } else if (field === 'command') {
    state.command = value;
    state.commandInputCursor = cursor;
  } else if (field === 'url') {
    state.url = value;
    state.urlInputCursor = cursor;
  } else if (field === 'bearerToken') {
    state.bearerToken = value;
    state.bearerTokenCursor = cursor;
  }
}

/**
 * Handle auth type selection
 */
function handleAuthTypeInput(key: string, state: AddServerFormState): void {
  const types: Array<'none' | 'bearer' | 'oauth' | 'api-key'> = [
    'none',
    'bearer',
    'oauth',
    'api-key',
  ];
  const idx = types.indexOf(state.authType);

  if (key === 'arrowleft') {
    state.authType = types[(idx - 1 + types.length) % types.length];
  } else if (key === 'arrowright') {
    state.authType = types[(idx + 1) % types.length];
  }
}

/**
 * Validate form before submission
 */
function validateAddServerForm(state: AddServerFormState): {
  state: AddServerFormState;
  action?: string;
} {
  let valid = true;

  // Validate name
  if (!state.name.trim()) {
    state.nameError = 'Server name is required';
    valid = false;
  }

  // Validate command/url
  if (state.type === 'stdio') {
    if (!state.command.trim()) {
      state.commandError = 'Command is required';
      valid = false;
    }
  } else {
    if (!state.url.trim()) {
      state.urlError = 'URL is required';
      valid = false;
    }
  }

  if (valid) {
    return { state, action: 'submit' };
  }

  return { state };
}

/**
 * Create initial form state
 */
export function createAddServerFormState(): AddServerFormState {
  return {
    name: '',
    nameError: '',
    type: 'stdio',
    command: 'node',
    commandError: '',
    url: 'https://',
    urlError: '',
    focusedField: 'name',
    nameInputCursor: 0,
    commandInputCursor: 4,
    urlInputCursor: 8,
    authType: 'none',
    bearerToken: '',
    bearerTokenCursor: 0,
    submitted: false,
  };
}

/**
 * Extract server config from form state
 */
export function extractServerConfig(state: AddServerFormState) {
  const config: any = {
    name: state.name.trim(),
    type: state.type,
    auth: null,
  };

  if (state.type === 'stdio') {
    config.command = state.command.trim().split(' ')[0];
    config.args = state.command.trim().split(' ').slice(1);
  } else {
    config.url = state.url.trim();
  }

  if (state.authType === 'bearer' && state.bearerToken) {
    config.auth = {
      type: 'bearer',
      token: state.bearerToken,
    };
  }

  return config;
}
