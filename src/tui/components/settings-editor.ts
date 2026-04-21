/**
 * Settings Editor Component
 * 
 * Edit MCP CLI and daemon configuration settings through a form interface.
 */

import { FormInputField, renderFormFields, validateFormFields, getFormValues, validators } from './form-input.js';
import { ExtendedDaemonConfig } from '../..';

/**
 * Create settings form fields from daemon config
 */
export function createSettingsFormFields(config: ExtendedDaemonConfig): FormInputField[] {
  return [
    {
      name: 'enabled',
      label: 'Enable Daemon',
      type: 'boolean',
      value: config.basic?.enabled ?? true,
      description: 'Enable or disable the daemon service',
    },
    {
      name: 'autoStart',
      label: 'Auto-start on Boot',
      type: 'boolean',
      value: config.basic?.autoStart ?? false,
      description: 'Automatically start daemon when system boots',
    },
    {
      name: 'logLevel',
      label: 'Log Level',
      type: 'select',
      value: config.logging?.level ?? 'info',
      options: [
        { label: 'Debug', value: 'debug' },
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warn' },
        { label: 'Error', value: 'error' },
      ],
      description: 'Minimum logging level for daemon logs',
    },
    {
      name: 'maxFileSize',
      label: 'Max Log File Size (MB)',
      type: 'number',
      value: (config.logging?.maxFileSize ?? 52428800) / (1024 * 1024),
      validation: validators.positiveNumber,
      description: 'Maximum size before log file rotation (in MB)',
    },
    {
      name: 'maxFiles',
      label: 'Max Log Files',
      type: 'number',
      value: config.logging?.maxFiles ?? 10,
      validation: validators.positiveNumber,
      description: 'Number of log files to keep',
    },
    {
      name: 'retentionDays',
      label: 'Log Retention Days',
      type: 'number',
      value: config.logging?.retentionDays ?? 7,
      validation: validators.positiveNumber,
      description: 'Delete logs older than this many days',
    },
    {
      name: 'checkInterval',
      label: 'Health Check Interval (seconds)',
      type: 'number',
      value: (config.health?.checkInterval ?? 30000) / 1000,
      validation: validators.positiveNumber,
      description: 'How often to check daemon health',
    },
    {
      name: 'cacheInterval',
      label: 'Discovery Cache Interval (seconds)',
      type: 'number',
      value: (config.discovery?.cacheInterval ?? 300000) / 1000,
      validation: validators.positiveNumber,
      description: 'How often to refresh tool cache',
    },
    {
      name: 'cacheTTL',
      label: 'Cache TTL (seconds)',
      type: 'number',
      value: (config.discovery?.cacheTTL ?? 300000) / 1000,
      validation: validators.positiveNumber,
      description: 'How long to keep cached tools',
    },
    {
      name: 'gracefulShutdownTimeout',
      label: 'Graceful Shutdown Timeout (seconds)',
      type: 'number',
      value: (config.advanced?.gracefulShutdownTimeout ?? 10000) / 1000,
      validation: validators.positiveNumber,
      description: 'Wait time before force killing daemon',
    },
  ];
}

/**
 * Render settings editor view
 */
export function renderSettingsEditorView(
  fields: FormInputField[],
  selectedIndex: number = 0,
  errors: Record<string, string> = {},
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' SETTINGS & CONFIGURATION'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  // Settings section
  lines.push('┌─ DAEMON SETTINGS ─' + '─'.repeat(Math.max(1, terminalWidth - 21)) + '┐');
  lines.push('│' + ' '.repeat(terminalWidth - 2) + '│');
  
  const fieldLines = renderFormFields(
    fields,
    selectedIndex,
    errors,
    terminalWidth - 4
  );
  
  for (const line of fieldLines) {
    lines.push('│ ' + line.padEnd(terminalWidth - 3) + '│');
  }
  
  lines.push('│' + ' '.repeat(terminalWidth - 2) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  
  // Actions
  lines.push('┌─ ACTIONS ─' + '─'.repeat(Math.max(1, terminalWidth - 13)) + '┐');
  lines.push('│ [S] Save Changes   [R] Reset to Defaults   [D] Dashboard   [Q] Quit'.padEnd(terminalWidth - 1) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Render settings groups
 */
export function renderSettingsGrouped(
  fields: FormInputField[],
  selectedIndex: number = 0,
  errors: Record<string, string> = {},
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  const groups: Record<string, FormInputField[]> = {
    'Basic': fields.filter(f => f.name === 'enabled' || f.name === 'autoStart'),
    'Logging': fields.filter(f => f.name.startsWith('logLevel') || f.name.startsWith('maxFile') || f.name.startsWith('retention')),
    'Performance': fields.filter(f => f.name.includes('Interval') || f.name.includes('Cache') || f.name.includes('Timeout')),
  };
  
  let fieldIndex = 0;
  for (const [groupName, groupFields] of Object.entries(groups)) {
    if (groupFields.length === 0) continue;
    
    lines.push(`\n┌─ ${groupName} ─` + '─'.repeat(Math.max(1, terminalWidth - groupName.length - 6)) + '┐');
    
    for (const field of groupFields) {
      const isSelected = fieldIndex === selectedIndex;
      const indicator = isSelected ? '► ' : '  ';
      const value = field.type === 'select'
        ? field.options?.find(o => o.value === field.value)?.label || 'Unknown'
        : field.value;
      
      lines.push(`│${indicator}${field.label}: ${value}`.padEnd(terminalWidth - 1) + '│');
      
      if (isSelected && field.description) {
        lines.push(`│  ${field.description}`.padEnd(terminalWidth - 1) + '│');
      }
      
      fieldIndex++;
    }
    
    lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  }
  
  return lines;
}

/**
 * Render settings summary
 */
export function renderSettingsSummary(
  config: ExtendedDaemonConfig,
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' CURRENT SETTINGS'.padEnd(terminalWidth - 1) + '║');
  lines.push('╠' + '═'.repeat(terminalWidth - 2) + '╣');
  
  lines.push(`║ Daemon: ${config.basic?.enabled ? 'Enabled' : 'Disabled'}`.padEnd(terminalWidth - 1) + '║');
  lines.push(`║ Auto-start: ${config.basic?.autoStart ? 'Yes' : 'No'}`.padEnd(terminalWidth - 1) + '║');
  lines.push(`║ Log Level: ${config.logging?.level || 'info'}`.padEnd(terminalWidth - 1) + '║');
  lines.push(`║ Max File Size: ${(config.logging?.maxFileSize ?? 52428800) / 1024 / 1024}MB`.padEnd(terminalWidth - 1) + '║');
  lines.push(`║ Cache TTL: ${(config.discovery?.cacheTTL ?? 300000) / 1000}s`.padEnd(terminalWidth - 1) + '║');
  
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  
  return lines;
}

/**
 * Validate settings
 */
export function validateSettings(fields: FormInputField[]): Record<string, string> {
  return validateFormFields(fields);
}

/**
 * Get settings as object
 */
export function getSettingsValues(fields: FormInputField[]): Record<string, any> {
  return getFormValues(fields);
}
