/**
 * Settings Editor View Component
 * 
 * Interactive form for editing daemon and CLI settings.
 */

import { FormField, renderForm, renderFormButtons } from '../components/form-input.js';
import { renderConfirmDialog } from '../components/confirm-dialog.js';

/**
 * Default daemon settings form fields
 */
export const daemonSettingsFields: FormField[] = [
  {
    id: 'enabled',
    label: 'Enable Daemon',
    type: 'toggle',
    value: true,
    description: 'Enable the MCP daemon service',
  },
  {
    id: 'autoStart',
    label: 'Auto-start on Boot',
    type: 'checkbox',
    value: true,
    description: 'Automatically start daemon when system boots',
  },
  {
    id: 'logLevel',
    label: 'Log Level',
    type: 'select',
    value: 'info',
    options: [
      { label: 'Debug', value: 'debug' },
      { label: 'Info', value: 'info' },
      { label: 'Warning', value: 'warning' },
      { label: 'Error', value: 'error' },
    ],
    description: 'Logging verbosity level',
  },
  {
    id: 'cacheEnabled',
    label: 'Enable Tool Cache',
    type: 'toggle',
    value: true,
    description: 'Cache tool definitions for faster access',
  },
  {
    id: 'cacheTTL',
    label: 'Cache TTL (seconds)',
    type: 'number',
    value: 300,
    validation: (value: unknown) => {
      const num = Number(value);
      if (isNaN(num) || num < 0) return 'Must be a positive number';
      if (num > 86400) return 'Maximum 24 hours';
      return null;
    },
    description: 'How long to cache tool definitions',
  },
  {
    id: 'healthCheckInterval',
    label: 'Health Check Interval (seconds)',
    type: 'number',
    value: 30,
    description: 'How often to check daemon health',
  },
  {
    id: 'maxConnections',
    label: 'Max Concurrent Connections',
    type: 'number',
    value: 100,
    description: 'Maximum allowed client connections',
  },
];

/**
 * Render settings editor view
 */
export function renderSettingsEditorView(
  fields: FormField[] = daemonSettingsFields,
  focusedFieldId?: string,
  errors?: Record<string, string>,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' SETTINGS'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Form
  const maxFieldsVisible = Math.min(height - 10, fields.length);
  
  for (let i = 0; i < maxFieldsVisible; i++) {
    const field = fields[i];
    const isFocused = field.id === focusedFieldId;
    const error = errors?.[field.id];
    
    // Field label
    const required = field.required ? ' *' : '';
    lines.push('║ ' + `${field.label}${required}`.padEnd(width - 4) + ' ║');
    
    // Input field
    const inputLine = renderSettingInput(field, isFocused, width);
    for (const line of inputLine) {
      lines.push('║' + line.substring(0, width - 2) + '║');
    }
    
    // Error message
    if (error) {
      const errorMsg = `⚠ ${error}`.substring(0, width - 6);
      lines.push('║ ' + errorMsg.padEnd(width - 4) + ' ║');
    }
    
    // Description
    if (field.description && isFocused) {
      const desc = `  ${field.description}`.substring(0, width - 6);
      lines.push('║ ' + desc.padEnd(width - 4) + ' ║');
    }
    
    lines.push('║ ' + ' '.repeat(width - 4) + ' ║');
  }
  
  if (fields.length > maxFieldsVisible) {
    lines.push('║ ' + `... and ${fields.length - maxFieldsVisible} more settings`.padEnd(width - 4) + ' ║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Action buttons
  lines.push('║ [Save]              [Reset]              [Cancel]'.padEnd(width - 1) + '║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render a single settings input
 */
function renderSettingInput(
  field: FormField,
  isFocused: boolean = false,
  width: number = 60
): string[] {
  const lines: string[] = [];
  const inputWidth = width - 6;
  
  const focusIndicator = isFocused ? '→' : ' ';
  
  switch (field.type) {
    case 'toggle':
      const toggleState = field.value === true ? '[ON ]' : '[OFF]';
      lines.push(` ${focusIndicator} ${toggleState}`.padEnd(width - 2));
      break;
      
    case 'checkbox':
      const checked = field.value === true ? '☑' : '☐';
      lines.push(` ${focusIndicator} ${checked}`.padEnd(width - 2));
      break;
      
    case 'select':
      const selected = field.value || field.options?.[0].value;
      lines.push(` ${focusIndicator} ┌─ ${String(selected).padEnd(inputWidth - 4)} ─┐`.padEnd(width - 2));
      break;
      
    case 'number':
      const numVal = String(field.value || '');
      lines.push(` ${focusIndicator} /${numVal.padEnd(inputWidth - 4)}\\`.padEnd(width - 2));
      break;
      
    default: // text
      const textVal = String(field.value || '');
      lines.push(` ${focusIndicator} /${textVal.padEnd(inputWidth - 4)}\\`.padEnd(width - 2));
  }
  
  return lines;
}

/**
 * Render settings confirmation dialog
 */
export function renderSettingsSaveConfirm(
  changes: Record<string, unknown>,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' CONFIRM CHANGES?'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ ' + 'The following settings will be updated:'.padEnd(width - 3) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  let count = 0;
  for (const [key, value] of Object.entries(changes)) {
    if (count >= 5) {
      lines.push('║ ' + `... and ${Object.keys(changes).length - 5} more`.padEnd(width - 3) + '║');
      break;
    }
    const line = `  ${key}: ${value}`.substring(0, width - 6);
    lines.push('║ ' + line.padEnd(width - 4) + ' ║');
    count++;
  }
  
  lines.push('║'.padEnd(width - 1) + '║');
  lines.push('║ [Save]              [Cancel]'.padEnd(width - 1) + '║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render settings reset warning
 */
export function renderSettingsResetWarning(width: number = 60): string[] {
  return renderConfirmDialog(
    {
      title: 'Reset Settings?',
      message: 'This will reset all settings to their default values. This action cannot be undone.',
      okText: 'Reset',
      cancelText: 'Cancel',
      isDangerous: true,
    },
    false,
    width
  );
}
