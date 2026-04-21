/**
 * Tool List View Component
 * 
 * Browse available MCP tools with search and filter capabilities.
 * Shows tool details when selected.
 */

import { ToolTUIInfo } from '../types.js';
import { ListItem, renderListWithSearch, ListNavigator } from './list-view.js';

/**
 * Convert tool info to list item
 */
export function toolToListItem(tool: ToolTUIInfo): ListItem {
  const badge = tool.isCached ? 'cached' : 'live';
  return {
    id: tool.name,
    label: tool.name,
    description: `${tool.server} - ${tool.description}`,
    badge: badge,
    badgeColor: tool.isCached ? 'success' : 'warning',
  };
}

/**
 * Render tool list view
 */
export function renderToolListView(
  tools: ToolTUIInfo[],
  selectedIndex: number = 0,
  searchQuery: string = '',
  terminalWidth: number = 80,
  terminalHeight: number = 24
): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push('╔' + '═'.repeat(terminalWidth - 2) + '╗');
  lines.push('║' + ' AVAILABLE TOOLS'.padEnd(terminalWidth - 1) + '║');
  lines.push('╚' + '═'.repeat(terminalWidth - 2) + '╝');
  lines.push('');
  
  // Convert tools to list items
  const items = tools.map(toolToListItem);
  
  // Render list with search
  const listHeight = terminalHeight - 15;
  const listWidth = terminalWidth - 2;
  const listLines = renderListWithSearch(
    items,
    selectedIndex,
    searchQuery,
    listHeight,
    listWidth
  );
  
  for (const line of listLines) {
    lines.push(line);
  }
  
  lines.push('');
  
  // Show selected tool details if available
  if (items[selectedIndex]) {
    const selected = tools[selectedIndex];
    lines.push('┌─ TOOL DETAILS ─' + '─'.repeat(Math.max(1, terminalWidth - 18)) + '┐');
    lines.push(`│ Name: ${selected.name}`.padEnd(terminalWidth - 1) + '│');
    lines.push(`│ Server: ${selected.server}`.padEnd(terminalWidth - 1) + '│');
    lines.push(`│ Description: ${selected.description}`.padEnd(terminalWidth - 1) + '│');
    if (selected.category) {
      lines.push(`│ Category: ${selected.category}`.padEnd(terminalWidth - 1) + '│');
    }
    lines.push(`│ Status: ${selected.isCached ? 'Cached (Fast)' : 'Live'}`.padEnd(terminalWidth - 1) + '│');
    lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  }
  
  lines.push('');
  
  // Keyboard hints
  lines.push('┌─ CONTROLS ─' + '─'.repeat(Math.max(1, terminalWidth - 15)) + '┐');
  lines.push('│ ↑/↓: Navigate  /: Search  Enter: Execute  d: Dashboard  q: Quit'.padEnd(terminalWidth - 1) + '│');
  lines.push('└' + '─'.repeat(terminalWidth - 2) + '┘');
  
  return lines;
}

/**
 * Filter tools by query
 */
export function filterTools(
  tools: ToolTUIInfo[],
  query: string
): ToolTUIInfo[] {
  if (!query) return tools;
  
  const lower = query.toLowerCase();
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(lower) ||
    tool.description.toLowerCase().includes(lower) ||
    tool.server.toLowerCase().includes(lower) ||
    tool.category?.toLowerCase().includes(lower)
  );
}

/**
 * Sort tools
 */
export function sortTools(
  tools: ToolTUIInfo[],
  sortBy: 'name' | 'server' | 'cached' | 'lastUsed' = 'name'
): ToolTUIInfo[] {
  const sorted = [...tools];
  
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    
    case 'server':
      sorted.sort((a, b) => a.server.localeCompare(b.server));
      break;
    
    case 'cached':
      sorted.sort((a, b) => 
        (b.isCached ? 1 : 0) - (a.isCached ? 1 : 0)
      );
      break;
    
    case 'lastUsed':
      sorted.sort((a, b) => {
        const aTime = a.lastUsed?.getTime() || 0;
        const bTime = b.lastUsed?.getTime() || 0;
        return bTime - aTime;
      });
      break;
  }
  
  return sorted;
}

/**
 * Group tools by server
 */
export function groupToolsByServer(
  tools: ToolTUIInfo[]
): Map<string, ToolTUIInfo[]> {
  const groups = new Map<string, ToolTUIInfo[]>();
  
  for (const tool of tools) {
    if (!groups.has(tool.server)) {
      groups.set(tool.server, []);
    }
    groups.get(tool.server)!.push(tool);
  }
  
  return groups;
}

/**
 * Group tools by category
 */
export function groupToolsByCategory(
  tools: ToolTUIInfo[]
): Map<string, ToolTUIInfo[]> {
  const groups = new Map<string, ToolTUIInfo[]>();
  
  for (const tool of tools) {
    const category = tool.category || 'Uncategorized';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(tool);
  }
  
  return groups;
}

/**
 * Render tools grouped
 */
export function renderToolsGrouped(
  tools: ToolTUIInfo[],
  groupBy: 'server' | 'category' = 'server',
  terminalWidth: number = 80
): string[] {
  const lines: string[] = [];
  
  const groups = groupBy === 'server' 
    ? groupToolsByServer(tools)
    : groupToolsByCategory(tools);
  
  let groupNum = 0;
  for (const [groupName, groupTools] of groups.entries()) {
    if (groupNum > 0) lines.push('');
    
    lines.push(`╭─ ${groupName} (${groupTools.length}) ─`.padEnd(terminalWidth - 1) + '╮');
    
    for (const tool of groupTools) {
      const badge = tool.isCached ? '[cached]' : '[live]';
      lines.push(`│ • ${tool.name}${' '.repeat(Math.max(0, terminalWidth - tool.name.length - 15))}${badge}│`);
    }
    
    lines.push('╰' + '─'.repeat(terminalWidth - 2) + '╯');
    groupNum++;
  }
  
  return lines;
}

/**
 * Get tool statistics
 */
export function getToolStats(tools: ToolTUIInfo[]) {
  const cachedCount = tools.filter(t => t.isCached).length;
  const servers = new Set(tools.map(t => t.server)).size;
  const categories = new Set(tools.map(t => t.category || 'Uncategorized')).size;
  
  return {
    total: tools.length,
    cached: cachedCount,
    live: tools.length - cachedCount,
    servers,
    categories,
  };
}
