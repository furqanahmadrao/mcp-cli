/**
 * Tool List View Component
 * 
 * Interactive view for browsing, searching, and selecting MCP tools.
 */

import { ToolTUIInfo } from '../types.js';
import { renderSelectableList, renderSearchableList, ListItem } from '../components/selectable-list.js';
import { renderButtonGroup } from '../components/button.js';

/**
 * Convert ToolTUIInfo to ListItem
 */
function toolToListItem(tool: ToolTUIInfo): ListItem {
  return {
    id: tool.name,
    label: tool.name,
    description: tool.description,
    metadata: {
      server: tool.server,
      category: tool.category,
      isCached: tool.isCached,
    },
  };
}

/**
 * Render tool list view
 */
export function renderToolListView(
  tools: ToolTUIInfo[],
  selectedIndex: number = 0,
  searchQuery: string = '',
  width: number = 80,
  height: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║' + ' AVAILABLE TOOLS'.padEnd(width - 1) + '║');
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  // Search bar
  const searchText = searchQuery ? `Search: ${searchQuery}` : 'Search: (Press "/" to search)';
  lines.push('║ ' + searchText.padEnd(width - 3) + '║');
  
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  // Tool list
  const listItems = tools.map(toolToListItem);
  let displayList: ListItem[];
  let displayIndex = selectedIndex;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayList = listItems.filter(
      item =>
        item.label.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
    // Find index of selected item in filtered list
    if (displayList.length > 0) {
      displayIndex = 0;
    }
  } else {
    displayList = listItems;
  }
  
  const maxVisible = Math.min(height - 12, 10);
  const startOffset = Math.max(0, displayIndex - Math.floor(maxVisible / 2));
  
  for (let i = 0; i < maxVisible && startOffset + i < displayList.length; i++) {
    const tool = displayList[startOffset + i];
    const isSelected = startOffset + i === displayIndex;
    
    const prefix = isSelected ? '▶ ' : '  ';
    const label = prefix + tool.label;
    
    const content = label.substring(0, width - 4);
    const padding = width - content.length - 4;
    lines.push('║ ' + content + ' '.repeat(Math.max(0, padding)) + ' ║');
    
    // Show description for selected tool
    if (isSelected && tool.description) {
      const desc = `  ${tool.description}`.substring(0, width - 6);
      lines.push('║ ' + desc.padEnd(width - 4) + ' ║');
    }
  }
  
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  // Tool details (if selected)
  if (displayList.length > 0 && displayIndex < displayList.length) {
    const selected = displayList[displayIndex];
    const server = selected.metadata?.server as string || 'Unknown';
    const cached = (selected.metadata?.isCached as boolean) ? '✓' : '✕';
    
    lines.push('║ SELECTED TOOL:'.padEnd(width - 1) + '║');
    lines.push('║ Name: ' + selected.label.padEnd(width - 9) + '║');
    lines.push('║ Server: ' + server.padEnd(width - 11) + '║');
    lines.push('║ Cached: ' + cached.padEnd(width - 11) + '║');
  }
  
  lines.push('╠' + '─'.repeat(width - 2) + '╣');
  
  // Action buttons
  const buttons = ['Execute', 'Details', 'Back'];
  const buttonLines = renderButtonGroup(buttons, 0, width - 2);
  for (const line of buttonLines) {
    lines.push('║' + line + '║');
  }
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render tool details pane
 */
export function renderToolDetailsPane(
  tool: ToolTUIInfo,
  width: number = 60,
  detailedInfo?: Record<string, string>
): string[] {
  const lines: string[] = [];
  
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  lines.push('║ TOOL DETAILS'.padEnd(width - 1) + '║');
  lines.push('╠' + '═'.repeat(width - 2) + '╣');
  
  // Basic info
  lines.push('║ Name:'.padEnd(width - 1) + '║');
  lines.push('║   ' + tool.name.padEnd(width - 6) + ' ║');
  
  lines.push('║'.padEnd(width - 1) + '║');
  
  lines.push('║ Description:'.padEnd(width - 1) + '║');
  const desc = `  ${tool.description}`.substring(0, width - 4);
  lines.push('║ ' + desc.padEnd(width - 3) + '║');
  
  lines.push('║'.padEnd(width - 1) + '║');
  
  lines.push('║ Server: ' + tool.server.padEnd(width - 11) + '║');
  
  if (tool.category) {
    lines.push('║ Category: ' + tool.category.padEnd(width - 13) + '║');
  }
  
  lines.push('║ Cached: ' + (tool.isCached ? '✓ Yes' : '✕ No').padEnd(width - 11) + '║');
  
  if (tool.lastUsed) {
    const dateStr = tool.lastUsed.toLocaleDateString();
    lines.push('║ Last Used: ' + dateStr.padEnd(width - 14) + '║');
  }
  
  // Detailed info if available
  if (detailedInfo && Object.keys(detailedInfo).length > 0) {
    lines.push('║'.padEnd(width - 1) + '║');
    lines.push('║ PARAMETERS:'.padEnd(width - 1) + '║');
    
    for (const [key, value] of Object.entries(detailedInfo)) {
      const param = `  ${key}: ${value}`.substring(0, width - 4);
      lines.push('║ ' + param.padEnd(width - 3) + '║');
    }
  }
  
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines;
}

/**
 * Render minimal tool info card
 */
export function renderToolCard(
  tool: ToolTUIInfo,
  isSelected: boolean = false,
  width: number = 50
): string[] {
  const lines: string[] = [];
  
  const border = isSelected ? '█' : '┃';
  
  lines.push(border + '─'.repeat(width - 2) + border);
  lines.push(border + ' ' + tool.name.padEnd(width - 4) + ' ' + border);
  
  const desc = tool.description.substring(0, width - 4);
  lines.push(border + ' ' + desc.padEnd(width - 4) + ' ' + border);
  
  lines.push(border + '─'.repeat(width - 2) + border);
  
  return lines;
}
