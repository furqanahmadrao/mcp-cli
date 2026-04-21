/**
 * Horizontal Split Layout Component
 * 
 * Two-column side-by-side layout with adjustable divider.
 */

export interface HorizontalSplitConfig {
  leftWidth?: number;
  rightWidth?: number;
  minLeftWidth: number;
  minRightWidth: number;
  dividerWidth?: number;
  showDivider?: boolean;
}

export type FocusedPane = 'left' | 'right';

/**
 * Render horizontal split layout with left and right panes
 */
export function renderHorizontalSplit(
  leftContent: string[],
  rightContent: string[],
  totalWidth: number = 80,
  totalHeight: number = 24,
  config: Partial<HorizontalSplitConfig> = {},
  focusedPane: FocusedPane = 'left'
): string[] {
  const finalConfig: HorizontalSplitConfig = {
    minLeftWidth: config.minLeftWidth ?? 20,
    minRightWidth: config.minRightWidth ?? 20,
    dividerWidth: config.dividerWidth ?? 1,
    showDivider: config.showDivider ?? true,
    leftWidth: config.leftWidth,
    rightWidth: config.rightWidth,
  };

  const dividerWidth = finalConfig.showDivider ? (finalConfig.dividerWidth ?? 1) : 0;
  const availableWidth = totalWidth - dividerWidth;

  // Calculate pane widths
  let leftWidth = finalConfig.leftWidth ?? Math.floor(availableWidth / 2);
  let rightWidth = availableWidth - leftWidth;

  // Enforce minimum widths
  if (leftWidth < finalConfig.minLeftWidth) {
    leftWidth = finalConfig.minLeftWidth;
    rightWidth = availableWidth - leftWidth;
  }
  if (rightWidth < finalConfig.minRightWidth) {
    rightWidth = finalConfig.minRightWidth;
    leftWidth = availableWidth - rightWidth;
  }

  const lines: string[] = [];

  // Render each row
  for (let row = 0; row < totalHeight; row++) {
    const leftLine = leftContent[row] || '';
    const rightLine = rightContent[row] || '';

    // Format left pane with focus indicator
    let leftFormatted = leftLine.substring(0, leftWidth);
    if (leftFormatted.length < leftWidth) {
      leftFormatted = leftFormatted.padEnd(leftWidth);
    }

    // Add left border if focused
    if (focusedPane === 'left' && row === 0) {
      leftFormatted = '╭' + leftFormatted.substring(1);
    } else if (focusedPane === 'left' && row === totalHeight - 1) {
      leftFormatted = '╰' + leftFormatted.substring(1);
    } else if (focusedPane === 'left') {
      leftFormatted = '│' + leftFormatted.substring(1);
    }

    // Format right pane with focus indicator
    let rightFormatted = rightLine.substring(0, rightWidth);
    if (rightFormatted.length < rightWidth) {
      rightFormatted = rightFormatted.padEnd(rightWidth);
    }

    // Add right border if focused
    if (focusedPane === 'right' && row === 0) {
      rightFormatted = rightFormatted.substring(0, rightWidth - 1) + '╮';
    } else if (focusedPane === 'right' && row === totalHeight - 1) {
      rightFormatted = rightFormatted.substring(0, rightWidth - 1) + '╯';
    } else if (focusedPane === 'right') {
      rightFormatted = rightFormatted.substring(0, rightWidth - 1) + '│';
    }

    // Combine with divider
    let line = leftFormatted;
    if (finalConfig.showDivider) {
      line += '│';
    }
    line += rightFormatted;

    lines.push(line);
  }

  return lines;
}

/**
 * Render vertical split layout with top and bottom panes
 */
export function renderVerticalSplit(
  topContent: string[],
  bottomContent: string[],
  totalWidth: number = 80,
  totalHeight: number = 24,
  config: Partial<HorizontalSplitConfig> = {},
  focusedPane: FocusedPane = 'left' // 'left' means top, 'right' means bottom
): string[] {
  const finalConfig: HorizontalSplitConfig = {
    minLeftWidth: config.minLeftWidth ?? 10, // min top height
    minRightWidth: config.minRightWidth ?? 10, // min bottom height
    dividerWidth: config.dividerWidth ?? 1,
    showDivider: config.showDivider ?? true,
    leftWidth: config.leftWidth,
    rightWidth: config.rightWidth,
  };

  // Calculate pane heights
  let topHeight = finalConfig.leftWidth ?? Math.floor(totalHeight / 2);
  let bottomHeight = totalHeight - topHeight - (finalConfig.showDivider ? 1 : 0);

  // Enforce minimum heights
  if (topHeight < finalConfig.minLeftWidth) {
    topHeight = finalConfig.minLeftWidth;
    bottomHeight = totalHeight - topHeight - (finalConfig.showDivider ? 1 : 0);
  }
  if (bottomHeight < finalConfig.minRightWidth) {
    bottomHeight = finalConfig.minRightWidth;
    topHeight = totalHeight - bottomHeight - (finalConfig.showDivider ? 1 : 0);
  }

  const lines: string[] = [];

  // Render top pane
  for (let row = 0; row < topHeight; row++) {
    let line = topContent[row] || '';
    if (line.length < totalWidth) {
      line = line.padEnd(totalWidth);
    } else {
      line = line.substring(0, totalWidth);
    }

    // Add top border if focused
    if (focusedPane === 'left' && row === 0) {
      line = '╔' + line.substring(1, totalWidth - 1) + '╗';
    } else if (focusedPane === 'left') {
      line = '║' + line.substring(1, totalWidth - 1) + '║';
    }

    lines.push(line);
  }

  // Render divider
  if (finalConfig.showDivider) {
    const divider = '╠' + '═'.repeat(totalWidth - 2) + '╣';
    lines.push(divider);
  }

  // Render bottom pane
  for (let row = 0; row < bottomHeight; row++) {
    let line = bottomContent[row] || '';
    if (line.length < totalWidth) {
      line = line.padEnd(totalWidth);
    } else {
      line = line.substring(0, totalWidth);
    }

    // Add bottom border if focused
    if (focusedPane === 'right' && row === bottomHeight - 1) {
      line = '╚' + line.substring(1, totalWidth - 1) + '╝';
    } else if (focusedPane === 'right') {
      line = '║' + line.substring(1, totalWidth - 1) + '║';
    }

    lines.push(line);
  }

  return lines;
}

/**
 * Calculate actual pane widths based on config
 */
export function calculateSplitWidths(
  totalWidth: number,
  config: Partial<HorizontalSplitConfig> = {}
): { leftWidth: number; rightWidth: number } {
  const finalConfig: HorizontalSplitConfig = {
    minLeftWidth: config.minLeftWidth ?? 20,
    minRightWidth: config.minRightWidth ?? 20,
    dividerWidth: config.dividerWidth ?? 1,
    showDivider: config.showDivider ?? true,
    leftWidth: config.leftWidth,
    rightWidth: config.rightWidth,
  };

  const dividerWidth = finalConfig.showDivider ? (finalConfig.dividerWidth ?? 1) : 0;
  const availableWidth = totalWidth - dividerWidth;

  let leftWidth = finalConfig.leftWidth ?? Math.floor(availableWidth / 2);
  let rightWidth = availableWidth - leftWidth;

  if (leftWidth < finalConfig.minLeftWidth) {
    leftWidth = finalConfig.minLeftWidth;
    rightWidth = availableWidth - leftWidth;
  }
  if (rightWidth < finalConfig.minRightWidth) {
    rightWidth = finalConfig.minRightWidth;
    leftWidth = availableWidth - rightWidth;
  }

  return { leftWidth, rightWidth };
}

/**
 * Calculate actual pane heights based on config
 */
export function calculateSplitHeights(
  totalHeight: number,
  config: Partial<HorizontalSplitConfig> = {}
): { topHeight: number; bottomHeight: number } {
  const finalConfig: HorizontalSplitConfig = {
    minLeftWidth: config.minLeftWidth ?? 10,
    minRightWidth: config.minRightWidth ?? 10,
    dividerWidth: config.dividerWidth ?? 1,
    showDivider: config.showDivider ?? true,
    leftWidth: config.leftWidth,
    rightWidth: config.rightWidth,
  };

  let topHeight = finalConfig.leftWidth ?? Math.floor(totalHeight / 2);
  let bottomHeight = totalHeight - topHeight - (finalConfig.showDivider ? 1 : 0);

  if (topHeight < finalConfig.minLeftWidth) {
    topHeight = finalConfig.minLeftWidth;
    bottomHeight = totalHeight - topHeight - (finalConfig.showDivider ? 1 : 0);
  }
  if (bottomHeight < finalConfig.minRightWidth) {
    bottomHeight = finalConfig.minRightWidth;
    topHeight = totalHeight - bottomHeight - (finalConfig.showDivider ? 1 : 0);
  }

  return { topHeight, bottomHeight };
}
