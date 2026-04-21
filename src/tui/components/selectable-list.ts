/**
 * Selectable List Component
 * 
 * Reusable component for rendering scrollable, selectable lists
 * with keyboard navigation support.
 */

/**
 * Item in a selectable list
 */
export interface ListItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Render a selectable list
 */
export function renderSelectableList(
  items: ListItem[],
  selectedIndex: number = 0,
  width: number = 60,
  maxVisible: number = 10,
  startOffset: number = 0
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  
  // Calculate visible range
  const endOffset = Math.min(startOffset + maxVisible, items.length);
  const visibleItems = items.slice(startOffset, endOffset);
  
  // Render items
  for (let i = 0; i < visibleItems.length; i++) {
    const globalIndex = startOffset + i;
    const item = visibleItems[i];
    const isSelected = globalIndex === selectedIndex;
    
    // Selection indicator
    const indicator = isSelected ? '▶ ' : '  ';
    
    // Format label
    let label = item.label;
    if (item.disabled) {
      label = `[${label}]`;
    }
    
    // Highlight if selected
    if (isSelected) {
      label = `► ${label}`;
    } else {
      label = `  ${label}`;
    }
    
    // Construct line
    const content = label.substring(0, width - 4);
    const padding = width - content.length - 2;
    lines.push('│ ' + content + ' '.repeat(Math.max(0, padding)) + '│');
    
    // Description if available
    if (item.description && isSelected) {
      const desc = item.description.substring(0, width - 4);
      const descPadding = width - desc.length - 2;
      lines.push('│ ' + desc + ' '.repeat(Math.max(0, descPadding)) + '│');
    }
  }
  
  // Scroll indicator if needed
  if (items.length > maxVisible) {
    const indicator = startOffset > 0 ? '▲' : ' ';
    const indicator2 = endOffset < items.length ? '▼' : ' ';
    const middle = ' '.repeat(Math.max(0, width - 4));
    lines.push('│ ' + indicator + middle + indicator2 + '│');
  }
  
  // Footer
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}

/**
 * Render list with search results highlighting
 */
export function renderSearchableList(
  items: ListItem[],
  searchQuery: string,
  selectedIndex: number = 0,
  width: number = 60,
  maxVisible: number = 10,
  startOffset: number = 0
): string[] {
  const lines: string[] = [];
  
  // Search header
  lines.push('┌ Search Results ─'.padEnd(width - 1, '─') + '┐');
  lines.push(`│ Query: ${searchQuery}`.padEnd(width - 1) + '│');
  lines.push('├' + '─'.repeat(width - 2) + '┤');
  
  // Filter items by search query
  const lowerQuery = searchQuery.toLowerCase();
  const filteredItems = items.filter(
    item => 
      item.label.toLowerCase().includes(lowerQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerQuery))
  );
  
  if (filteredItems.length === 0) {
    lines.push('│ No results found'.padEnd(width - 1) + '│');
    lines.push('└' + '─'.repeat(width - 2) + '┘');
    return lines;
  }
  
  // Render filtered items
  const endOffset = Math.min(startOffset + maxVisible, filteredItems.length);
  const visibleItems = filteredItems.slice(startOffset, endOffset);
  
  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];
    const isSelected = i === selectedIndex;
    
    const prefix = isSelected ? '► ' : '  ';
    let label = prefix + item.label;
    
    // Highlight search terms
    const regex = new RegExp(`(${lowerQuery})`, 'gi');
    label = label.replace(regex, '[$1]');
    
    const content = label.substring(0, width - 4);
    const padding = width - content.length - 2;
    lines.push('│ ' + content + ' '.repeat(Math.max(0, padding)) + '│');
  }
  
  // Results count
  lines.push('│' + '─'.repeat(width - 2) + '│');
  const countText = `Found ${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''}`;
  lines.push('│ ' + countText.padEnd(width - 3) + '│');
  
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}

/**
 * Render compact list (single line items)
 */
export function renderCompactList(
  items: ListItem[],
  selectedIndex: number = 0,
  width: number = 60
): string[] {
  const lines: string[] = [];
  
  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  
  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];
    const isSelected = i === selectedIndex;
    const prefix = isSelected ? '▶' : ' ';
    const label = `${prefix} ${item.label}`;
    
    const content = label.substring(0, width - 4);
    const padding = width - content.length - 2;
    lines.push('│ ' + content + ' '.repeat(Math.max(0, padding)) + '│');
  }
  
  if (items.length > 5) {
    lines.push('│ ... and ' + (items.length - 5) + ' more'.padEnd(width - 3) + '│');
  }
  
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}
