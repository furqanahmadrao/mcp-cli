/**
 * Tool Execution Wizard Component
 * 
 * Multi-step wizard for executing MCP tools with parameter input.
 * Guides users through tool selection, parameter input, confirmation, and result display.
 */

import { ToolTUIInfo } from '../types.js';
import { FormInputField } from './form-input.js';

export type WizardStep = 'tool' | 'params' | 'confirm' | 'executing' | 'results';

/**
 * Tool parameter information
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string }>;
}

/**
 * Wizard state
 */
export interface ExecutionWizardState {
  step: WizardStep;
  selectedTool?: ToolTUIInfo;
  parameters: Record<string, any>;
  isExecuting: boolean;
  result?: string;
  error?: string;
}

/**
 * Render wizard step indicator
 */
export function renderWizardSteps(
  currentStep: WizardStep,
  terminalWidth: number = 80
): string {
  const steps: WizardStep[] = ['tool', 'params', 'confirm', 'results'];
  const stepLabels: Record<WizardStep, string> = {
    tool: 'Select Tool',
    params: 'Parameters',
    confirm: 'Confirm',
    results: 'Results',
    executing: 'Executing',
  };
  
  const indicators = steps.map((step, index) => {
    const isCurrentStep = step === currentStep;
    const icon = isCurrentStep ? '●' : '○';
    return `${icon} ${stepLabels[step]}`;
  }).join(' → ');
  
  return indicators;
}

/**
 * Render tool selection step
 */
export function renderToolSelectionStep(
  tools: ToolTUIInfo[],
  selectedIndex: number = 0,
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' EXECUTION WIZARD - SELECT TOOL'.padEnd(terminalWidth - 1) + '║');
  lines.push('║' + renderWizardSteps('tool', terminalWidth - 2).padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  lines.push('┌─ AVAILABLE TOOLS ─' + '─'.repeat(Math.max(1, terminalWidth - 21)) + '┐');
  
  const maxItems = Math.min(tools.length, terminalHeight - 12);
  const startIdx = Math.max(0, selectedIndex - Math.floor(maxItems / 2));
  
  for (let i = startIdx; i < startIdx + maxItems && i < tools.length; i++) {
    const tool = tools[i];
    const indicator = i === selectedIndex ? '► ' : '  ';
    const line = `${indicator}${tool.name} (${tool.server})`;
    lines.push(`│ ${line}`.padEnd(terminalWidth - 1) + '│');
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  lines.push('↓ Navigate with ↑/↓, Press Enter to Select');
  
  return lines;
}

/**
 * Render parameters input step
 */
export function renderParametersStep(
  tool: ToolTUIInfo,
  parameters: ToolParameter[],
  values: Record<string, any>,
  selectedIndex: number = 0,
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' EXECUTION WIZARD - PARAMETERS'.padEnd(terminalWidth - 1) + '║');
  lines.push('║' + renderWizardSteps('params', terminalWidth - 2).padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  lines.push(`Tool: ${tool.name}`);
  lines.push(`Server: ${tool.server}`);
  lines.push('');
  
  lines.push('┌─ PARAMETERS ─' + '─'.repeat(Math.max(1, terminalWidth - 16)) + '┐');
  
  if (parameters.length === 0) {
    lines.push('│ No parameters required for this tool'.padEnd(terminalWidth - 1) + '│');
  } else {
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const value = values[param.name] ?? param.defaultValue ?? '';
      const isSelected = i === selectedIndex;
      const indicator = isSelected ? '► ' : '  ';
      const required = param.required ? '*' : '';
      
      lines.push(`│ ${indicator}${param.name}${required}`.padEnd(terminalWidth - 1) + '│');
      
      if (isSelected) {
        lines.push(`│   Type: ${param.type}, Value: ${value}`.padEnd(terminalWidth - 1) + '│');
        
        if (param.description) {
          lines.push(`│   ${param.description}`.padEnd(terminalWidth - 1) + '│');
        }
      }
    }
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  lines.push('Edit values and press Enter to continue');
  
  return lines;
}

/**
 * Render confirmation step
 */
export function renderConfirmationStep(
  tool: ToolTUIInfo,
  parameters: ToolParameter[],
  values: Record<string, any>,
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' EXECUTION WIZARD - CONFIRM'.padEnd(terminalWidth - 1) + '║');
  lines.push('║' + renderWizardSteps('confirm', terminalWidth - 2).padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  lines.push('┌─ EXECUTION DETAILS ─' + '─'.repeat(Math.max(1, terminalWidth - 23)) + '┐');
  lines.push(`│ Tool: ${tool.name}`.padEnd(terminalWidth - 1) + '│');
  lines.push(`│ Server: ${tool.server}`.padEnd(terminalWidth - 1) + '│');
  lines.push(`│ Description: ${tool.description}`.padEnd(terminalWidth - 1) + '│');
  lines.push('│' + ' '.repeat(terminalWidth - 2) + '│');
  
  if (parameters.length > 0) {
    lines.push('│ Parameters:'.padEnd(terminalWidth - 1) + '│');
    for (const param of parameters) {
      const value = values[param.name] ?? param.defaultValue ?? '(empty)';
      lines.push(`│   • ${param.name}: ${value}`.padEnd(terminalWidth - 1) + '│');
    }
  } else {
    lines.push('│ No parameters required'.padEnd(terminalWidth - 1) + '│');
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  
  lines.push('┌─ CONFIRM ─' + '─'.repeat(Math.max(1, terminalWidth - 13)) + '┐');
  lines.push('│ Execute this tool now?'.padEnd(terminalWidth - 1) + '│');
  lines.push('│ [Enter] Execute   [Esc] Cancel'.padEnd(terminalWidth - 1) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Render executing step
 */
export function renderExecutingStep(
  tool: ToolTUIInfo,
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' EXECUTION IN PROGRESS'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  lines.push('┌' + '─'.repeat(terminalWidth - 2) + '┐');
  lines.push(`│ Executing: ${tool.name}...`.padEnd(terminalWidth - 1) + '│');
  lines.push('│'.padEnd(terminalWidth - 1) + '│');
  lines.push('│ ⏳ Please wait...'.padEnd(terminalWidth - 1) + '│');
  lines.push('│'.padEnd(terminalWidth - 1) + '│');
  
  // Animated spinner
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const spinner = spinners[Math.floor(Date.now() / 100) % spinners.length];
  lines.push(`│ ${spinner} Processing...`.padEnd(terminalWidth - 1) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Render results step
 */
export function renderResultsStep(
  tool: ToolTUIInfo,
  result: string,
  error?: string,
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' EXECUTION RESULTS'.padEnd(terminalWidth - 1) + '║');
  lines.push('║' + renderWizardSteps('results', terminalWidth - 2).padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  const status = error ? '✕ Failed' : '✓ Success';
  const statusLine = `${status} - Tool: ${tool.name}`;
  lines.push(statusLine);
  lines.push('');
  
  lines.push('┌─ OUTPUT ─' + '─'.repeat(Math.max(1, terminalWidth - 12)) + '┐');
  
  const resultLines = (error || result).split('\n');
  const maxLines = terminalHeight - 15;
  
  for (let i = 0; i < Math.min(resultLines.length, maxLines); i++) {
    const line = resultLines[i];
    const truncated = line.length > terminalWidth - 4
      ? line.substring(0, terminalWidth - 7) + '...'
      : line;
    
    lines.push(`│ ${truncated}`.padEnd(terminalWidth - 1) + '│');
  }
  
  if (resultLines.length > maxLines) {
    lines.push(`│ ... (${resultLines.length - maxLines} more lines) ...`.padEnd(terminalWidth - 1) + '│');
  }
  
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  lines.push('');
  lines.push('Press [Enter] to return to Dashboard');
  
  return lines;
}

/**
 * Get wizard progress
 */
export function getWizardProgress(step: WizardStep): number {
  const steps: WizardStep[] = ['tool', 'params', 'confirm', 'results'];
  const index = steps.indexOf(step);
  if (index === -1) return 0;
  return Math.round((index + 1) / steps.length * 100);
}
