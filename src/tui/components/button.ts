/**
 * Button Component
 * 
 * Reusable button component for TUI interactions.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type ButtonState = 'default' | 'focused' | 'disabled' | 'loading';

/**
 * Button configuration
 */
export interface ButtonConfig {
  label: string;
  variant?: ButtonVariant;
  state?: ButtonState;
  width?: number;
}

/**
 * Render a single button
 */
export function renderButton(config: ButtonConfig): string {
  const { label, variant = 'primary', state = 'default', width = 20 } = config;
  
  const variantChars = {
    primary: { left: '[', right: ']', fill: '=' },
    secondary: { left: '(', right: ')', fill: '-' },
    danger: { left: '[', right: ']', fill: '!' },
    success: { left: '[', right: ']', fill: '+' },
  };
  
  const stateChars = {
    default: ' ',
    focused: '▶',
    disabled: '✕',
    loading: '◐',
  };
  
  const chars = variantChars[variant];
  const stateChar = stateChars[state];
  
  const truncated = label.substring(0, width - 6);
  const padding = width - truncated.length - 4;
  
  return `${stateChar}${chars.left} ${truncated}${' '.repeat(padding)} ${chars.right}`;
}

/**
 * Render button pair (OK/Cancel style)
 */
export function renderButtonPair(
  leftLabel: string = 'OK',
  rightLabel: string = 'Cancel',
  selectedLeft: boolean = true,
  totalWidth: number = 40
): string[] {
  const lines: string[] = [];
  
  const buttonWidth = Math.floor((totalWidth - 6) / 2);
  
  const leftState = selectedLeft ? 'focused' : 'default';
  const rightState = !selectedLeft ? 'focused' : 'default';
  
  const left = renderButton({
    label: leftLabel,
    variant: 'primary',
    state: leftState,
    width: buttonWidth,
  });
  
  const right = renderButton({
    label: rightLabel,
    variant: 'secondary',
    state: rightState,
    width: buttonWidth,
  });
  
  lines.push('  ' + left + '  ' + right);
  
  return lines;
}

/**
 * Render button group
 */
export function renderButtonGroup(
  buttons: string[],
  selectedIndex: number = 0,
  totalWidth: number = 60
): string[] {
  const lines: string[] = [];
  
  if (buttons.length === 0) return lines;
  
  const buttonWidth = Math.floor((totalWidth - 6) / buttons.length);
  let buttonRow = '  ';
  
  for (let i = 0; i < buttons.length; i++) {
    const isSelected = i === selectedIndex;
    const state = isSelected ? 'focused' : 'default';
    
    const btn = renderButton({
      label: buttons[i],
      variant: 'primary',
      state,
      width: buttonWidth,
    });
    
    buttonRow += btn;
    if (i < buttons.length - 1) {
      buttonRow += '  ';
    }
  }
  
  lines.push(buttonRow);
  
  return lines;
}

/**
 * Create a clickable button representation
 */
export function createButton(
  label: string,
  onClick?: () => void,
  options?: { disabled?: boolean; width?: number }
) {
  return {
    label,
    onClick,
    disabled: options?.disabled || false,
    width: options?.width || 15,
  };
}
