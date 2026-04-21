/**
 * Confirm Dialog Component
 * 
 * Modal confirmation dialogs for user prompts.
 */

export interface ConfirmOptions {
  title: string;
  message: string;
  okText?: string;
  cancelText?: string;
  isDangerous?: boolean; // Red styling for dangerous actions
}

/**
 * Render a confirmation dialog
 */
export function renderConfirmDialog(
  options: ConfirmOptions,
  selectedOK: boolean = true,
  width: number = 60
): string[] {
  const {
    title,
    message,
    okText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
  } = options;
  
  const lines: string[] = [];
  
  // Top border
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  
  // Title
  const titleText = title.substring(0, width - 4);
  const titlePadding = width - titleText.length - 4;
  lines.push('║ ' + titleText + ' '.repeat(Math.max(0, titlePadding)) + ' ║');
  
  // Divider
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  // Message (word wrapped)
  const words = message.split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length <= width - 6) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
  }
  
  // Empty line
  lines.push('║ ' + ' '.repeat(width - 4) + ' ║');
  
  // Buttons
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  const buttonWidth = Math.floor((width - 6) / 2);
  
  // OK button
  const okPrefix = selectedOK ? '▶' : ' ';
  const okColor = isDangerous ? '⚠' : '✓';
  const okBtn = `${okPrefix}[${okColor} ${okText}]`.substring(0, buttonWidth);
  
  // Cancel button
  const cancelPrefix = !selectedOK ? '▶' : ' ';
  const cancelBtn = `${cancelPrefix}[ ✗ ${cancelText}]`.substring(0, buttonWidth);
  
  const buttonLine = `║ ${okBtn.padEnd(buttonWidth)} ${cancelBtn.padEnd(buttonWidth)} ║`;
  lines.push(buttonLine);
  
  // Bottom border
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render yes/no dialog
 */
export function renderYesNoDialog(
  message: string,
  selectedYes: boolean = true,
  width: number = 50
): string[] {
  return renderConfirmDialog(
    {
      title: 'Confirm',
      message,
      okText: 'Yes',
      cancelText: 'No',
    },
    selectedYes,
    width
  );
}

/**
 * Render warning dialog
 */
export function renderWarningDialog(
  title: string,
  message: string,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  
  const warningText = `⚠ ${title}`.substring(0, width - 4);
  const padding = width - warningText.length - 4;
  lines.push('║ ' + warningText + ' '.repeat(Math.max(0, padding)) + ' ║');
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  const words = message.split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length <= width - 6) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
  }
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render error dialog
 */
export function renderErrorDialog(
  title: string,
  error: string,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  
  const errorText = `✕ ${title}`.substring(0, width - 4);
  const padding = width - errorText.length - 4;
  lines.push('║ ' + errorText + ' '.repeat(Math.max(0, padding)) + ' ║');
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  const words = error.split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length <= width - 6) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push('║ ' + currentLine.padEnd(width - 4) + ' ║');
  }
  
  lines.push('║ ' + ' '.repeat(width - 4) + ' ║');
  lines.push('║ ' + 'Press any key to continue'.padEnd(width - 4) + ' ║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render progress dialog
 */
export function renderProgressDialog(
  title: string,
  message: string,
  progress: number = 0, // 0-100
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  
  const titleText = title.substring(0, width - 4);
  const titlePadding = width - titleText.length - 4;
  lines.push('║ ' + titleText + ' '.repeat(Math.max(0, titlePadding)) + ' ║');
  
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  lines.push('║ ' + message.padEnd(width - 4) + ' ║');
  
  // Progress bar
  const barWidth = width - 6;
  const filledWidth = Math.floor((barWidth * progress) / 100);
  const bar = '█'.repeat(filledWidth) + '░'.repeat(Math.max(0, barWidth - filledWidth));
  lines.push('║ |' + bar + '| ║');
  
  const percentText = `${progress}%`.padStart(4);
  lines.push('║ ' + percentText.padEnd(width - 4) + ' ║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}
