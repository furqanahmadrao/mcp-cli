/**
 * Selectable List Component
 * 
 * Reusable list view with keyboard navigation support.
 * Displays items with selection indicator and handles up/down movement.
 */

export interface ListItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: 'success' | 'warning' | 'error';
}

/**
 * Render a single list item
 */
export function renderListItem(
  item: ListItem,
  selected: boolean = false,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  // Item with selection indicator
  const indicator = selected ? '► ' : '  ';
  const badge = item.badge ? ` [${item.badge}]` : '';
  const label = `${indicator}${item.label}${badge}`;
  
  lines.push(label.padEnd(width));
  
  // Description if provided
  if (item.description && selected) {
    const descLines = item.description.split('\n');
    for (const desc of descLines) {
      lines.push(`  ${desc}`);
    }
  }
  
  return lines;
}

/**
 * Render a complete list with selection
 */
export function renderSelectableList(
  items: ListItem[],
  selectedIndex: number = 0,
  maxHeight: number = 15,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  // Calculate visible range
  const startIndex = Math.max(0, selectedIndex - Math.floor(maxHeight / 2));
  const endIndex = Math.min(items.length, startIndex + maxHeight);
  
  // Top border
  lines.push('┌─ Items (' + items.length + ') ' + '─'.repeat(Math.max(1, width - 13)) + '┐');
  
  // List items
  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    const isSelected = i === selectedIndex;
    const itemLines = renderListItem(item, isSelected, width - 2);
    
    for (const line of itemLines) {
      lines.push('│ ' + line.padEnd(width - 2) + ' │');
    }
  }
  
  // Scrollbar indicator if needed
  if (items.length > maxHeight) {
    const scrollPercent = Math.floor((selectedIndex / items.length) * 100);
    lines.push(`│ Scroll: ${scrollPercent}% ${'▌'.repeat(Math.floor((width - 15) * scrollPercent / 100))}`.padEnd(width - 1) + '│');
  }
  
  // Bottom border
  lines.push('└' + '─'.repeat(width) + '┘');
  
  return lines;
}

/**
 * Render list with search box
 */
export function renderListWithSearch(
  items: ListItem[],
  selectedIndex: number = 0,
  searchQuery: string = '',
  maxHeight: number = 12,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  // Search input
  lines.push('┌─ Search ─' + '─'.repeat(Math.max(1, width - 11)) + '┐');
  lines.push(`│ ${searchQuery}${'_'.repeat(Math.max(0, width - searchQuery.length - 3))}│`);
  lines.push('├' + '─'.repeat(width) + '┤');
  
  // Filtered items
  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (filtered.length === 0) {
    lines.push(`│ No items found${' '.repeat(Math.max(0, width - 16))}│`);
  } else {
    const itemLines = renderSelectableList(
      filtered,
      Math.min(selectedIndex, filtered.length - 1),
      maxHeight,
      width - 2
    );
    
    for (const line of itemLines.slice(1, itemLines.length - 1)) {
      lines.push('│ ' + line.padEnd(width - 2) + ' │');
    }
  }
  
  lines.push('└' + '─'.repeat(width) + '┘');
  
  return lines;
}

/**
 * Create a compact list view
 */
export function renderCompactList(
  items: ListItem[],
  selectedIndex: number = 0,
  lines: number = 5,
  width: number = 50
): string[] {
  const result: string[] = [];
  
  const start = Math.max(0, selectedIndex - Math.floor(lines / 2));
  const end = Math.min(items.length, start + lines);
  
  for (let i = start; i < end; i++) {
    const item = items[i];
    const indicator = i === selectedIndex ? '> ' : '  ';
    const badge = item.badge ? ` [${item.badge}]` : '';
    result.push((indicator + item.label + badge).padEnd(width));
  }
  
  return result;
}

/**
 * List navigation helper
 */
export class ListNavigator {
  private selectedIndex: number = 0;
  private items: ListItem[] = [];
  
  constructor(items: ListItem[] = []) {
    this.items = items;
    this.selectedIndex = 0;
  }
  
  /**
   * Update items
   */
  setItems(items: ListItem[]): void {
    this.items = items;
    if (this.selectedIndex >= items.length) {
      this.selectedIndex = Math.max(0, items.length - 1);
    }
  }
  
  /**
   * Move selection up
   */
  moveUp(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }
  
  /**
   * Move selection down
   */
  moveDown(): void {
    if (this.selectedIndex < this.items.length - 1) {
      this.selectedIndex++;
    }
  }
  
  /**
   * Jump to home
   */
  home(): void {
    this.selectedIndex = 0;
  }
  
  /**
   * Jump to end
   */
  end(): void {
    this.selectedIndex = Math.max(0, this.items.length - 1);
  }
  
  /**
   * Get selected item
   */
  getSelected(): ListItem | undefined {
    return this.items[this.selectedIndex];
  }
  
  /**
   * Get selected index
   */
  getSelectedIndex(): number {
    return this.selectedIndex;
  }
  
  /**
   * Set selected index
   */
  setSelectedIndex(index: number): void {
    this.selectedIndex = Math.max(0, Math.min(index, this.items.length - 1));
  }
  
  /**
   * Find item by id
   */
  findById(id: string): ListItem | undefined {
    return this.items.find(item => item.id === id);
  }
  
  /**
   * Get all items
   */
  getItems(): ListItem[] {
    return this.items;
  }
}
