/**
 * Tab Container Component
 * 
 * Tabbed interface with multiple views and lazy loading.
 */

export interface Tab {
  id: string;
  label: string;
  badge?: number;
  disabled?: boolean;
  icon?: string;
}

export interface TabContent {
  tabId: string;
  content: string[];
}

/**
 * Render tab bar header
 */
export function renderTabBar(
  tabs: Tab[],
  activeTabId: string,
  width: number = 70,
  position: 'top' | 'bottom' = 'top'
): string[] {
  const lines: string[] = [];

  // Build tab bar string
  let barContent = '';

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const isActive = tab.id === activeTabId;
    const isDisabled = tab.disabled ?? false;

    let tabLabel = tab.label;
    if (tab.icon) {
      tabLabel = `${tab.icon} ${tabLabel}`;
    }
    if (tab.badge !== undefined && tab.badge > 0) {
      tabLabel = `${tabLabel} (${tab.badge})`;
    }

    // Tab styling
    if (isActive) {
      barContent += ` ●${tabLabel}● `;
    } else if (isDisabled) {
      barContent += ` ○${tabLabel}○ `;
    } else {
      barContent += ` ◇${tabLabel}◇ `;
    }

    if (i < tabs.length - 1) {
      barContent += ' | ';
    }
  }

  // Truncate or pad to width
  if (barContent.length > width - 4) {
    barContent = barContent.substring(0, width - 7) + '...';
  }

  let tabBarLine = '';
  if (position === 'top') {
    tabBarLine = '╔ ' + barContent.padEnd(width - 3) + ' ╗';
  } else {
    tabBarLine = '╚ ' + barContent.padEnd(width - 3) + ' ╝';
  }

  lines.push(tabBarLine);

  return lines;
}

/**
 * Render tab container with content
 */
export function renderTabContainer(
  tabs: Tab[],
  activeTabId: string,
  tabContents: Map<string, string[]>,
  width: number = 70,
  height: number = 24,
  tabPosition: 'top' | 'bottom' = 'top'
): string[] {
  const lines: string[] = [];

  // Add tab bar at top
  if (tabPosition === 'top') {
    lines.push(...renderTabBar(tabs, activeTabId, width, 'top'));
  }

  // Find content height (account for tab bar and borders)
  const contentHeight = Math.max(1, height - 3 - (tabPosition === 'top' ? 1 : 1));

  // Get and render active tab content
  const activeContent = tabContents.get(activeTabId) || [];

  // Render content box
  lines.push('║ ' + '─'.repeat(width - 4) + ' ║');

  for (let row = 0; row < contentHeight; row++) {
    let contentLine = activeContent[row] || '';

    if (contentLine.length < width - 4) {
      contentLine = contentLine.padEnd(width - 4);
    } else {
      contentLine = contentLine.substring(0, width - 4);
    }

    lines.push('║ ' + contentLine + ' ║');
  }

  // Add tab bar at bottom if specified
  if (tabPosition === 'bottom') {
    lines.push('║ ' + '─'.repeat(width - 4) + ' ║');
    lines.push(...renderTabBar(tabs, activeTabId, width, 'bottom'));
  } else {
    lines.push('╚' + '═'.repeat(width - 2) + '╝');
  }

  return lines;
}

/**
 * Get tab navigation result based on key press
 */
export function getTabNavigation(
  key: string,
  tabs: Tab[],
  activeTabId: string
): { nextTabId: string; moved: boolean } {
  const activeIndex = tabs.findIndex(t => t.id === activeTabId);

  if (key === 'Left' || key === 'ArrowLeft') {
    // Move to previous tab
    let prevIndex = activeIndex - 1;
    while (prevIndex >= 0 && tabs[prevIndex].disabled) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      return { nextTabId: tabs[prevIndex].id, moved: true };
    }
  } else if (key === 'Right' || key === 'ArrowRight') {
    // Move to next tab
    let nextIndex = activeIndex + 1;
    while (nextIndex < tabs.length && tabs[nextIndex].disabled) {
      nextIndex++;
    }
    if (nextIndex < tabs.length) {
      return { nextTabId: tabs[nextIndex].id, moved: true };
    }
  } else if (key >= '1' && key <= '9') {
    // Jump to tab by number
    const tabIndex = parseInt(key) - 1;
    if (tabIndex < tabs.length && !tabs[tabIndex].disabled) {
      return { nextTabId: tabs[tabIndex].id, moved: true };
    }
  }

  return { nextTabId: activeTabId, moved: false };
}

/**
 * Create a tab from label
 */
export function createTab(
  id: string,
  label: string,
  options: Partial<Tab> = {}
): Tab {
  return {
    id,
    label,
    badge: options.badge,
    disabled: options.disabled ?? false,
    icon: options.icon,
  };
}

/**
 * Update tab badge count
 */
export function updateTabBadge(
  tabs: Tab[],
  tabId: string,
  count: number
): Tab[] {
  return tabs.map(t =>
    t.id === tabId ? { ...t, badge: count } : t
  );
}

/**
 * Enable/disable tab
 */
export function setTabEnabled(
  tabs: Tab[],
  tabId: string,
  enabled: boolean
): Tab[] {
  return tabs.map(t =>
    t.id === tabId ? { ...t, disabled: !enabled } : t
  );
}

/**
 * Find available tab to focus (skip disabled)
 */
export function findAvailableTab(
  tabs: Tab[],
  currentTabId?: string
): string | null {
  // First try current tab
  if (currentTabId && tabs.find(t => t.id === currentTabId && !t.disabled)) {
    return currentTabId;
  }

  // Find first enabled tab
  const enabledTab = tabs.find(t => !t.disabled);
  return enabledTab?.id ?? null;
}
