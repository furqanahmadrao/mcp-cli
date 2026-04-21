/**
 * Collapsible Panel Component
 * 
 * Expandable/collapsible content panels with keyboard navigation.
 */

export interface CollapsibleConfig {
  id: string;
  header: string;
  content: string[];
  isExpanded: boolean;
  icon?: string;
  level?: number;
  disabled?: boolean;
}

/**
 * Render single collapsible panel
 */
export function renderCollapsiblePanel(
  config: CollapsibleConfig,
  width: number = 70,
  showBorder: boolean = true
): string[] {
  const lines: string[] = [];

  // Calculate indentation
  const indent = ' '.repeat((config.level ?? 0) * 2);

  // Render header
  const expandIcon = config.isExpanded ? '▼' : '▶';
  const headerIcon = config.icon ?? '';
  const headerText = `${indent}${expandIcon} ${headerIcon} ${config.header}`.substring(0, width);

  if (showBorder) {
    lines.push('┌' + '─'.repeat(width - 2) + '┐');
  }

  lines.push('│ ' + headerText.padEnd(width - 3) + '│');

  // Render content if expanded
  if (config.isExpanded) {
    if (showBorder) {
      lines.push('├' + '─'.repeat(width - 2) + '┤');
    }

    const contentIndent = ' '.repeat((config.level ?? 0) * 2 + 2);
    for (const contentLine of config.content) {
      const line = contentIndent + contentLine;
      const truncated = line.substring(0, width - 3);
      lines.push('│ ' + truncated.padEnd(width - 3) + '│');
    }
  }

  if (showBorder) {
    lines.push('└' + '─'.repeat(width - 2) + '┘');
  }

  return lines;
}

/**
 * Render multiple collapsible panels (accordion-style)
 */
export function renderAccordion(
  panels: CollapsibleConfig[],
  focusedPanelId?: string,
  width: number = 70,
  height: number = 24,
  singleOpen: boolean = true
): string[] {
  const lines: string[] = [];

  let currentHeight = 0;
  const maxHeight = height - 2;

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const isFocused = panel.id === focusedPanelId;

    // Render panel
    const panelLines = renderCollapsiblePanel(panel, width, true);

    // Add focus indicator
    if (isFocused) {
      for (let j = 0; j < panelLines.length; j++) {
        if (j === 0) {
          panelLines[j] = '█' + panelLines[j].substring(1);
        } else if (j === panelLines.length - 1) {
          panelLines[j] = '█' + panelLines[j].substring(1);
        } else {
          panelLines[j] = '█' + panelLines[j].substring(1);
        }
      }
    }

    // Check if panel fits in remaining space
    if (currentHeight + panelLines.length <= maxHeight) {
      lines.push(...panelLines);
      currentHeight += panelLines.length;
    } else {
      // Add truncated panel and break
      const remainingLines = maxHeight - currentHeight;
      if (remainingLines > 2) {
        lines.push(...panelLines.slice(0, remainingLines - 1));
        lines.push('⋮'.padEnd(width));
      }
      break;
    }

    if (i < panels.length - 1) {
      lines.push('');
      currentHeight++;
    }
  }

  return lines;
}

/**
 * Toggle panel expanded state
 */
export function togglePanel(
  panels: CollapsibleConfig[],
  panelId: string,
  singleOpen: boolean = false
): CollapsibleConfig[] {
  return panels.map((panel, idx) => {
    if (panel.id === panelId) {
      return { ...panel, isExpanded: !panel.isExpanded };
    }
    // If single open mode, close other panels
    if (singleOpen && panel.isExpanded) {
      return { ...panel, isExpanded: false };
    }
    return panel;
  });
}

/**
 * Find next focusable panel
 */
export function getNextFocusedPanel(
  panels: CollapsibleConfig[],
  currentPanelId: string | undefined,
  direction: 'up' | 'down'
): string | undefined {
  const currentIndex = panels.findIndex(p => p.id === currentPanelId);

  if (direction === 'down') {
    for (let i = currentIndex + 1; i < panels.length; i++) {
      if (!panels[i].disabled) {
        return panels[i].id;
      }
    }
  } else {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!panels[i].disabled) {
        return panels[i].id;
      }
    }
  }

  return currentPanelId;
}

/**
 * Expand all panels
 */
export function expandAllPanels(panels: CollapsibleConfig[]): CollapsibleConfig[] {
  return panels.map(p => ({ ...p, isExpanded: true }));
}

/**
 * Collapse all panels
 */
export function collapseAllPanels(panels: CollapsibleConfig[]): CollapsibleConfig[] {
  return panels.map(p => ({ ...p, isExpanded: false }));
}

/**
 * Create a collapsible panel config
 */
export function createPanel(
  id: string,
  header: string,
  content: string[],
  options: Partial<CollapsibleConfig> = {}
): CollapsibleConfig {
  return {
    id,
    header,
    content,
    isExpanded: options.isExpanded ?? true,
    icon: options.icon,
    level: options.level ?? 0,
    disabled: options.disabled ?? false,
  };
}
