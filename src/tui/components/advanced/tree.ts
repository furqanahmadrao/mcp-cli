/**
 * Expandable Tree Component
 * 
 * Hierarchical tree view with expand/collapse and navigation.
 */

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Render tree node recursively
 */
function renderTreeNodeRecursive(
  node: TreeNode,
  depth: number = 0,
  width: number = 70,
  selectedNodeId?: string,
  maxDepth: number = 10
): string[] {
  const lines: string[] = [];

  if (depth > maxDepth) {
    return lines;
  }

  // Calculate indentation
  const indent = depth > 0 ? '  '.repeat(depth - 1) + '└─ ' : '';

  // Node indicator
  const isExpanded = node.expanded ?? false;
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedNodeId;
  const isDisabled = node.disabled ?? false;

  let expandIcon = '';
  if (hasChildren) {
    expandIcon = isExpanded ? '▼ ' : '▶ ';
  } else {
    expandIcon = '  ';
  }

  // Node icon
  const nodeIcon = node.icon ?? '○';

  // Selection indicator
  const selectionIcon = isSelected ? '●' : '◇';

  // Build node line
  let nodeLine = `${indent}${expandIcon}${selectionIcon} ${nodeIcon} ${node.label}`;
  if (isDisabled) {
    nodeLine += ' (disabled)';
  }

  nodeLine = nodeLine.substring(0, width - 1);
  lines.push(nodeLine);

  // Render children if expanded
  if (isExpanded && hasChildren && node.children) {
    for (const child of node.children) {
      const childLines = renderTreeNodeRecursive(child, depth + 1, width, selectedNodeId, maxDepth);
      lines.push(...childLines);
    }
  }

  return lines;
}

/**
 * Render tree structure
 */
export function renderExpandableTree(
  nodes: TreeNode[],
  selectedNodeId?: string,
  width: number = 70,
  height: number = 24
): string[] {
  const lines: string[] = [];

  lines.push('╔ Tree' + '─'.repeat(Math.max(1, width - 6)) + '╗');

  let currentHeight = 1;
  const maxHeight = height - 2;

  for (const node of nodes) {
    const nodeLines = renderTreeNodeRecursive(node, 0, width - 3, selectedNodeId);

    for (const line of nodeLines) {
      if (currentHeight >= maxHeight) {
        lines.push('│ ⋮' + ' '.repeat(width - 4) + '│');
        break;
      }

      const formattedLine = '│ ' + line.padEnd(width - 3) + '│';
      lines.push(formattedLine);
      currentHeight++;
    }

    if (currentHeight >= maxHeight) {
      break;
    }
  }

  // Fill remaining space
  while (currentHeight < maxHeight) {
    lines.push('│' + ' '.repeat(width - 1) + '│');
    currentHeight++;
  }

  lines.push('╚' + '═'.repeat(width - 2) + '╝');

  return lines;
}

/**
 * Flatten tree to list of nodes for easier navigation
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const flat: TreeNode[] = [];

  function flattenNode(node: TreeNode): void {
    flat.push(node);
    if (node.expanded && node.children) {
      for (const child of node.children) {
        flattenNode(child);
      }
    }
  }

  for (const node of nodes) {
    flattenNode(node);
  }

  return flat;
}

/**
 * Find node by ID
 */
export function findNode(nodes: TreeNode[], nodeId: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Toggle expand state of node
 */
export function toggleNodeExpanded(
  nodes: TreeNode[],
  nodeId: string
): TreeNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, expanded: !(node.expanded ?? false) };
    }
    if (node.children) {
      return { ...node, children: toggleNodeExpanded(node.children, nodeId) };
    }
    return node;
  });
}

/**
 * Select node by ID
 */
export function selectNode(
  nodes: TreeNode[],
  nodeId: string
): TreeNode[] {
  return nodes.map(node => {
    const isSelected = node.id === nodeId;
    let result = { ...node, selected: isSelected };

    if (node.children) {
      result = { ...result, children: selectNode(node.children, nodeId) };
    }

    return result;
  });
}

/**
 * Expand all nodes
 */
export function expandAllNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => {
    let result = { ...node, expanded: true };
    if (node.children) {
      result = { ...result, children: expandAllNodes(node.children) };
    }
    return result;
  });
}

/**
 * Collapse all nodes
 */
export function collapseAllNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => {
    let result = { ...node, expanded: false };
    if (node.children) {
      result = { ...result, children: collapseAllNodes(node.children) };
    }
    return result;
  });
}

/**
 * Get next node in tree navigation (down arrow)
 */
export function getNextTreeNode(
  nodes: TreeNode[],
  currentNodeId: string | undefined
): string | undefined {
  const flat = flattenTree(nodes);
  if (flat.length === 0) return undefined;

  if (!currentNodeId) {
    return flat[0].id;
  }

  const currentIndex = flat.findIndex(n => n.id === currentNodeId);
  if (currentIndex >= 0 && currentIndex < flat.length - 1) {
    return flat[currentIndex + 1].id;
  }

  return currentNodeId;
}

/**
 * Get previous node in tree navigation (up arrow)
 */
export function getPreviousTreeNode(
  nodes: TreeNode[],
  currentNodeId: string | undefined
): string | undefined {
  const flat = flattenTree(nodes);
  if (flat.length === 0) return undefined;

  if (!currentNodeId) {
    return flat[flat.length - 1].id;
  }

  const currentIndex = flat.findIndex(n => n.id === currentNodeId);
  if (currentIndex > 0) {
    return flat[currentIndex - 1].id;
  }

  return currentNodeId;
}

/**
 * Create a tree node
 */
export function createTreeNode(
  id: string,
  label: string,
  options: Partial<TreeNode> = {}
): TreeNode {
  return {
    id,
    label,
    children: options.children,
    expanded: options.expanded ?? false,
    selected: options.selected ?? false,
    disabled: options.disabled ?? false,
    icon: options.icon,
    metadata: options.metadata,
  };
}

/**
 * Count total nodes in tree
 */
export function countTreeNodes(nodes: TreeNode[]): number {
  let count = 0;

  function countNode(node: TreeNode): void {
    count++;
    if (node.children) {
      for (const child of node.children) {
        countNode(child);
      }
    }
  }

  for (const node of nodes) {
    countNode(node);
  }

  return count;
}

/**
 * Get tree depth
 */
export function getTreeDepth(nodes: TreeNode[]): number {
  let maxDepth = 0;

  function getDepth(node: TreeNode, currentDepth: number): void {
    maxDepth = Math.max(maxDepth, currentDepth);
    if (node.children) {
      for (const child of node.children) {
        getDepth(child, currentDepth + 1);
      }
    }
  }

  for (const node of nodes) {
    getDepth(node, 1);
  }

  return maxDepth;
}
