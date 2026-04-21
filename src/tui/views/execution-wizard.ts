/**
 * Execution Wizard Component
 * 
 * Multi-step wizard for executing MCP tools with parameter input.
 */

import { ToolTUIInfo } from '../types.js';
import { renderToolDetailsPane } from './tool-list-view.js';
import { FormField, renderForm } from '../components/form-input.js';

export type WizardStep = 'select' | 'parameters' | 'confirm' | 'executing' | 'results';

/**
 * Tool execution parameters
 */
export interface ExecutionParameters {
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp?: Date;
  executionId?: string;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Render wizard step indicator
 */
export function renderWizardStepIndicator(
  currentStep: number,
  totalSteps: number,
  stepNames: string[],
  width: number = 70
): string[] {
  const lines: string[] = [];
  
  const stepWidth = Math.floor((width - 6) / totalSteps);
  let stepLine = '║ ';
  
  for (let i = 0; i < totalSteps; i++) {
    const isCompleted = i < currentStep;
    const isCurrent = i === currentStep;
    
    let stepIndicator = '○';
    if (isCompleted) stepIndicator = '✓';
    if (isCurrent) stepIndicator = '●';
    
    const name = (stepNames[i] || `Step ${i + 1}`).substring(0, stepWidth - 4);
    const padding = stepWidth - name.length - 3;
    
    stepLine += `${stepIndicator} ${name}${' '.repeat(padding)} `;
  }
  
  stepLine += '║';
  lines.push(stepLine);
  
  return lines;
}

/**
 * Render tool selection step
 */
export function renderWizardToolSelection(
  tools: ToolTUIInfo[],
  selectedIndex: number = 0,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' EXECUTE TOOL - STEP 1: SELECT'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ Choose a tool to execute:'.padEnd(width - 1) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  const maxTools = Math.min(height - 10, 8);
  for (let i = 0; i < maxTools && i < tools.length; i++) {
    const tool = tools[i];
    const isSelected = i === selectedIndex;
    const prefix = isSelected ? '▶' : ' ';
    
    const name = tool.name.substring(0, width - 8);
    lines.push(`║ ${prefix} ${name}`.padEnd(width - 1) + '║');
  }
  
  if (tools.length > maxTools) {
    lines.push('║ ... and more'.padEnd(width - 1) + '║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  if (tools.length > selectedIndex) {
    const selected = tools[selectedIndex];
    lines.push('║ ' + selected.description.substring(0, width - 4).padEnd(width - 3) + '║');
  }
  
  lines.push('║ [Next]              [Cancel]'.padEnd(width - 1) + '║');
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render parameters input step
 */
export function renderWizardParametersStep(
  tool: ToolTUIInfo,
  fields: FormField[],
  focusedFieldId?: string,
  errors?: Record<string, string>,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' EXECUTE TOOL - STEP 2: PARAMETERS'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ Tool: ' + tool.name.padEnd(width - 9) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  lines.push('║ Enter parameters:'.padEnd(width - 1) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  const maxFields = Math.min(height - 12, fields.length);
  
  for (let i = 0; i < maxFields; i++) {
    const field = fields[i];
    const isFocused = field.id === focusedFieldId;
    
    // Field label
    lines.push('║ ' + field.label.padEnd(width - 4) + ' ║');
    
    // Input value
    const value = String(field.value || '');
    const inputLine = `  [ ${value.substring(0, width - 10)} ]`;
    const indicator = isFocused ? '→' : ' ';
    lines.push('║ ' + (indicator + inputLine).padEnd(width - 3) + '║');
    
    // Error if present
    if (errors?.[field.id]) {
      const errorMsg = `⚠ ${errors[field.id]}`.substring(0, width - 6);
      lines.push('║ ' + errorMsg.padEnd(width - 4) + ' ║');
    }
    
    lines.push('║'.padEnd(width - 1) + '║');
  }
  
  if (fields.length > maxFields) {
    lines.push('║ ... and ' + (fields.length - maxFields) + ' more fields'.padEnd(width - 1) + '║');
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ [Next]              [Back]              [Cancel]'.padEnd(width - 1) + '║');
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render confirmation step
 */
export function renderWizardConfirmStep(
  tool: ToolTUIInfo,
  parameters: Record<string, unknown>,
  width: number = 70
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' EXECUTE TOOL - STEP 3: CONFIRM'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ Ready to execute the following:'.padEnd(width - 1) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  lines.push('║ Tool: ' + tool.name.padEnd(width - 9) + '║');
  lines.push('║ ' + tool.description.substring(0, width - 4).padEnd(width - 3) + '║');
  
  lines.push('║'.padEnd(width - 1) + '║');
  lines.push('║ Parameters:'.padEnd(width - 1) + '║');
  
  let paramCount = 0;
  for (const [key, value] of Object.entries(parameters)) {
    if (paramCount >= 5) {
      lines.push('║ ... and more'.padEnd(width - 1) + '║');
      break;
    }
    const line = `  ${key}: ${value}`.substring(0, width - 6);
    lines.push('║ ' + line.padEnd(width - 4) + ' ║');
    paramCount++;
  }
  
  lines.push('║'.padEnd(width - 1) + '║');
  lines.push('║ [Execute]              [Back]              [Cancel]'.padEnd(width - 1) + '║');
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render executing step (progress)
 */
export function renderWizardExecutingStep(
  tool: ToolTUIInfo,
  progress: number = 0, // 0-100
  width: number = 70
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' EXECUTING TOOL'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ ' + tool.name.padEnd(width - 3) + '║');
  lines.push('║'.padEnd(width - 1) + '║');
  
  // Progress bar
  const barWidth = width - 8;
  const filledWidth = Math.floor((barWidth * progress) / 100);
  const bar = '█'.repeat(filledWidth) + '░'.repeat(Math.max(0, barWidth - filledWidth));
  lines.push('║ |' + bar + '| ║');
  
  const percentText = `${progress}%`.padStart(4);
  lines.push('║ ' + percentText.padEnd(width - 4) + ' ║');
  
  lines.push('║'.padEnd(width - 1) + '║');
  lines.push('║ Executing...'.padEnd(width - 1) + '║');
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render results step
 */
export function renderWizardResultsStep(
  tool: ToolTUIInfo,
  result: ExecutionResult,
  width: number = 80,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  const statusIcon = result.success ? '✓' : '✕';
  lines.push('║' + ` EXECUTION COMPLETE - ${statusIcon}`.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ Tool: ' + tool.name.padEnd(width - 9) + '║');
  lines.push('║ Status: ' + (result.success ? 'SUCCESS' : 'FAILED').padEnd(width - 11) + '║');
  
  if (result.executionTime !== undefined) {
    lines.push('║ Time: ' + `${result.executionTime}ms`.padEnd(width - 9) + '║');
  }
  
  lines.push('║'.padEnd(width - 1) + '║');
  
  if (result.success && result.output) {
    lines.push('║ OUTPUT:'.padEnd(width - 1) + '║');
    const outputLines = result.output.split('\n').slice(0, Math.min(height - 12, 8));
    for (const line of outputLines) {
      const content = line.substring(0, width - 6);
      lines.push('║ ' + content.padEnd(width - 4) + ' ║');
    }
  } else if (result.error) {
    lines.push('║ ERROR:'.padEnd(width - 1) + '║');
    const errorLines = result.error.split('\n').slice(0, Math.min(height - 12, 8));
    for (const line of errorLines) {
      const content = line.substring(0, width - 6);
      lines.push('║ ' + content.padEnd(width - 4) + ' ║');
    }
  }
  
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  lines.push('║ [Close]              [Execute Again]              [Back]'.padEnd(width - 1) + '║');
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}
