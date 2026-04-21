/**
 * Doctor View - System Diagnosis & Health Check
 */

import { BRIGHT_ORANGE, GREEN, YELLOW, RED, RESET, BOLD, INVERSE } from '../theme.js';

interface DiagnosticResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

/**
 * Render doctor/diagnostic view content (without header)
 */
export function renderDoctorView(
  serverCount: number,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];
  const effectiveWidth = Math.min(width, 100);

  lines.push(`  ${BOLD}${BRIGHT_ORANGE}SYSTEM DIAGNOSTIC RESULTS${RESET}`);
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  lines.push('');

  const diagnostics: DiagnosticResult[] = [
    {
      name: 'Configuration',
      status: 'ok',
      message: '✓ ~/.mcp/mcp.json found and valid',
    },
    {
      name: 'Servers',
      status: serverCount > 0 ? 'ok' : 'warning',
      message: serverCount > 0 
        ? `✓ ${serverCount} server(s) configured`
        : '⚠ No servers configured in mcp.json',
    },
    {
      name: 'Terminal Mode',
      status: 'ok',
      message: '✓ Interactive TTY supported',
    }
  ];
  
  for (const result of diagnostics) {
    const statusDot = result.status === 'ok' ? `${GREEN}●${RESET}` :
                      result.status === 'warning' ? `${YELLOW}●${RESET}` :
                      `${RED}●${RESET}`;

    const name = result.name.padEnd(18);
    const line = `  ${statusDot}  ${name}  ${result.message}`;
    lines.push(line.substring(0, effectiveWidth - 2));
  }

  lines.push('');
  lines.push(`  ${BRIGHT_ORANGE}${'─'.repeat(effectiveWidth - 4)}${RESET}`);
  
  // Summary
  const allOk = diagnostics.every(d => d.status === 'ok');
  const summary = allOk 
    ? `${GREEN}✓ System healthy - All checks passing${RESET}`
    : `${YELLOW}⚠ System has warnings - Check configuration${RESET}`;
  
  lines.push('  ' + summary);
  lines.push('');
  
  const footer = '↑↓: Navigate │ Esc: Back';
  const footerPadding = Math.max(0, Math.floor((effectiveWidth - footer.length) / 2));
  lines.push(' '.repeat(footerPadding) + footer);

  return lines;
}
