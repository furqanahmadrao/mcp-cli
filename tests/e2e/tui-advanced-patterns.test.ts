/**
 * Advanced View Patterns Tests (Week 6)
 * 
 * Comprehensive tests for layouts, tabs, collapsibles, trees, and updates.
 */

import { describe, it, expect } from 'vitest';
import {
  renderHorizontalSplit,
  renderVerticalSplit,
  calculateSplitWidths,
  calculateSplitHeights,
} from './components/advanced/layouts';
import {
  renderTabBar,
  renderTabContainer,
  getTabNavigation,
  createTab,
  updateTabBadge,
  findAvailableTab,
} from './components/advanced/tabs';
import {
  renderCollapsiblePanel,
  renderAccordion,
  togglePanel,
  getNextFocusedPanel,
  expandAllPanels,
  collapseAllPanels,
  createPanel,
} from './components/advanced/collapsible';
import {
  renderExpandableTree,
  flattenTree,
  findNode,
  toggleNodeExpanded,
  selectNode,
  expandAllNodes,
  collapseAllNodes,
  getNextTreeNode,
  getPreviousTreeNode,
  createTreeNode,
  countTreeNodes,
  getTreeDepth,
} from './components/advanced/tree';
import {
  ChangeTracker,
  detectChanges,
  highlightChanges,
  colorizeChange,
  renderChangeBadge,
  createChange,
  filterChanges,
  sortChangesByTime,
  summarizeChanges,
  renderChangeSummary,
} from './components/advanced/updates';

describe('HorizontalSplit Component', () => {
  it('should render basic horizontal split', () => {
    const left = ['Left 1', 'Left 2'];
    const right = ['Right 1', 'Right 2'];
    const output = renderHorizontalSplit(left, right, 60, 5);
    
    expect(output.length).toBeGreaterThan(0);
    expect(output.join('').includes('Left 1')).toBe(true);
    expect(output.join('').includes('Right 1')).toBe(true);
  });

  it('should calculate split widths correctly', () => {
    const widths = calculateSplitWidths(80, {});
    expect(widths.leftWidth + widths.rightWidth).toBeLessThanOrEqual(80);
  });

  it('should enforce minimum widths', () => {
    const widths = calculateSplitWidths(80, {
      minLeftWidth: 30,
      minRightWidth: 30,
    });
    expect(widths.leftWidth).toBeGreaterThanOrEqual(30);
    expect(widths.rightWidth).toBeGreaterThanOrEqual(30);
  });

  it('should render with focus indicator', () => {
    const left = ['Left content'];
    const right = ['Right content'];
    const output = renderHorizontalSplit(left, right, 50, 3, {}, 'left');
    expect(output.length).toBeGreaterThan(0);
  });

  it('should adapt to terminal width', () => {
    const left = ['Content'];
    const right = ['Content'];
    const narrow = renderHorizontalSplit(left, right, 40, 3);
    const wide = renderHorizontalSplit(left, right, 100, 3);
    expect(narrow.length).toBeGreaterThan(0);
    expect(wide.length).toBeGreaterThan(0);
  });

  it('should render vertical split', () => {
    const top = ['Top line'];
    const bottom = ['Bottom line'];
    const output = renderVerticalSplit(top, bottom, 60, 10);
    expect(output.length).toBeGreaterThan(0);
    expect(output.join('').includes('Top line')).toBe(true);
  });

  it('should calculate split heights correctly', () => {
    const heights = calculateSplitHeights(24, {});
    expect(heights.topHeight + heights.bottomHeight).toBeLessThanOrEqual(24);
  });
});

describe('TabContainer Component', () => {
  it('should render tab bar', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2'),
    ];
    const output = renderTabBar(tabs, 't1', 60);
    expect(output.length).toBeGreaterThan(0);
    expect(output.join('').includes('Tab 1')).toBe(true);
  });

  it('should render tab container', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2'),
    ];
    const contents = new Map([
      ['t1', ['Content 1']],
      ['t2', ['Content 2']],
    ]);
    const output = renderTabContainer(tabs, 't1', contents, 60, 15);
    expect(output.length).toBeGreaterThan(0);
  });

  it('should navigate tabs with arrow keys', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2'),
    ];
    const result = getTabNavigation('Right', tabs, 't1');
    expect(result.nextTabId).toBe('t2');
    expect(result.moved).toBe(true);
  });

  it('should handle disabled tabs', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2', { disabled: true }),
    ];
    const available = findAvailableTab(tabs, 't1');
    expect(available).toBe('t1');
  });

  it('should handle tab badges', () => {
    let tabs = [createTab('t1', 'Tab 1', { badge: 5 })];
    tabs = updateTabBadge(tabs, 't1', 10);
    expect(tabs[0].badge).toBe(10);
  });

  it('should support keyboard navigation by number', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2'),
      createTab('t3', 'Tab 3'),
    ];
    const result = getTabNavigation('2', tabs, 't1');
    expect(result.nextTabId).toBe('t2');
  });

  it('should render tabs with icons', () => {
    const tabs = [createTab('t1', 'Files', { icon: '📁' })];
    const output = renderTabBar(tabs, 't1', 60);
    expect(output.join('').includes('📁')).toBe(true);
  });

  it('should move left through tabs', () => {
    const tabs = [
      createTab('t1', 'Tab 1'),
      createTab('t2', 'Tab 2'),
    ];
    const result = getTabNavigation('Left', tabs, 't2');
    expect(result.nextTabId).toBe('t1');
  });

  it('should handle out-of-bounds navigation', () => {
    const tabs = [createTab('t1', 'Tab 1')];
    const result = getTabNavigation('Right', tabs, 't1');
    expect(result.moved).toBe(false);
  });
});

describe('CollapsiblePanel Component', () => {
  it('should render expanded panel', () => {
    const panel = createPanel('p1', 'Header', ['Content line 1', 'Content line 2']);
    const output = renderCollapsiblePanel(panel, 60);
    expect(output.length).toBeGreaterThan(0);
    expect(output.join('').includes('Content line 1')).toBe(true);
  });

  it('should render collapsed panel', () => {
    const panel = createPanel('p1', 'Header', ['Content'], { isExpanded: false });
    const output = renderCollapsiblePanel(panel, 60);
    expect(output.join('').includes('▶')).toBe(true);
  });

  it('should toggle panel state', () => {
    let panels = [createPanel('p1', 'Header', ['Content'])];
    panels = togglePanel(panels, 'p1');
    expect(panels[0].isExpanded).toBe(false);
  });

  it('should render accordion', () => {
    const panels = [
      createPanel('p1', 'Panel 1', ['Content 1']),
      createPanel('p2', 'Panel 2', ['Content 2']),
    ];
    const output = renderAccordion(panels, 'p1', 60, 20);
    expect(output.length).toBeGreaterThan(0);
  });

  it('should navigate between panels', () => {
    const panels = [
      createPanel('p1', 'Panel 1', ['Content 1']),
      createPanel('p2', 'Panel 2', ['Content 2']),
    ];
    const next = getNextFocusedPanel(panels, 'p1', 'down');
    expect(next).toBe('p2');
  });

  it('should expand all panels', () => {
    const panels = [
      createPanel('p1', 'Panel 1', ['Content'], { isExpanded: false }),
      createPanel('p2', 'Panel 2', ['Content'], { isExpanded: false }),
    ];
    const expanded = expandAllPanels(panels);
    expect(expanded.every(p => p.isExpanded)).toBe(true);
  });

  it('should collapse all panels', () => {
    const panels = [
      createPanel('p1', 'Panel 1', ['Content']),
      createPanel('p2', 'Panel 2', ['Content']),
    ];
    const collapsed = collapseAllPanels(panels);
    expect(collapsed.every(p => !p.isExpanded)).toBe(true);
  });

  it('should handle nested panels', () => {
    const panel = createPanel('p1', 'Parent', ['Content'], { level: 1 });
    const output = renderCollapsiblePanel(panel, 60);
    expect(output.length).toBeGreaterThan(0);
  });
});

describe('ExpandableTree Component', () => {
  it('should render tree', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [
          createTreeNode('n1-1', 'Child 1'),
        ],
      }),
    ];
    const output = renderExpandableTree(nodes, 'n1', 60, 15);
    expect(output.length).toBeGreaterThan(0);
    expect(output.join('').includes('Root')).toBe(true);
  });

  it('should flatten tree', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [
          createTreeNode('n1-1', 'Child'),
        ],
      }),
    ];
    const flat = flattenTree(nodes);
    expect(flat.length).toBe(2);
  });

  it('should find node by ID', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [
          createTreeNode('n1-1', 'Child'),
        ],
      }),
    ];
    const node = findNode(nodes, 'n1-1');
    expect(node?.label).toBe('Child');
  });

  it('should toggle node expansion', () => {
    let nodes = [
      createTreeNode('n1', 'Root', {
        children: [createTreeNode('n1-1', 'Child')],
        expanded: false,
      }),
    ];
    nodes = toggleNodeExpanded(nodes, 'n1');
    expect(nodes[0].expanded).toBe(true);
  });

  it('should select node', () => {
    let nodes = [
      createTreeNode('n1', 'Root'),
      createTreeNode('n2', 'Sibling'),
    ];
    nodes = selectNode(nodes, 'n1');
    expect(nodes[0].selected).toBe(true);
    expect(nodes[1].selected).toBe(false);
  });

  it('should expand all nodes', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [createTreeNode('n1-1', 'Child')],
        expanded: false,
      }),
    ];
    const expanded = expandAllNodes(nodes);
    expect(expanded[0].expanded).toBe(true);
  });

  it('should navigate tree', () => {
    const nodes = [
      createTreeNode('n1', 'First'),
      createTreeNode('n2', 'Second'),
    ];
    const next = getNextTreeNode(nodes, 'n1');
    expect(next).toBe('n2');
  });

  it('should count tree nodes', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [
          createTreeNode('n1-1', 'Child'),
        ],
      }),
    ];
    const count = countTreeNodes(nodes);
    expect(count).toBe(2);
  });

  it('should get tree depth', () => {
    const nodes = [
      createTreeNode('n1', 'Root', {
        children: [
          createTreeNode('n1-1', 'Child', {
            children: [createTreeNode('n1-1-1', 'Grandchild')],
          }),
        ],
      }),
    ];
    const depth = getTreeDepth(nodes);
    expect(depth).toBe(3);
  });
});

describe('ChangeTracker and Updates', () => {
  it('should track changes', () => {
    const tracker = new ChangeTracker();
    tracker.trackChange(createChange('added', 'item1', { newValue: 'value' }));
    
    expect(tracker.hasChanges('item1')).toBe(true);
  });

  it('should detect added items', () => {
    const old = [];
    const new_data = ['New item'];
    const changes = detectChanges(old, new_data);
    
    expect(changes.some(c => c.type === 'added')).toBe(true);
  });

  it('should detect removed items', () => {
    const old = ['Old item'];
    const new_data = [];
    const changes = detectChanges(old, new_data);
    
    expect(changes.some(c => c.type === 'removed')).toBe(true);
  });

  it('should detect modified items', () => {
    const old = ['Item A'];
    const new_data = ['Item B'];
    const changes = detectChanges(old, new_data);
    
    expect(changes.some(c => c.type === 'modified')).toBe(true);
  });

  it('should colorize changes', () => {
    const colored = colorizeChange('Line', 'added');
    expect(colored).toContain('\x1b[32m');
  });

  it('should render change badges', () => {
    const badge = renderChangeBadge('added');
    expect(badge).toBe('✚');
  });

  it('should filter changes', () => {
    const changes = [
      createChange('added', 'i1'),
      createChange('modified', 'i2'),
    ];
    const filtered = filterChanges(changes, c => c.type === 'added');
    expect(filtered.length).toBe(1);
  });

  it('should sort changes by time', () => {
    const changes = [
      createChange('added', 'i1', { timestamp: 100 }),
      createChange('added', 'i2', { timestamp: 200 }),
    ];
    const sorted = sortChangesByTime(changes, true);
    expect(sorted[0].itemId).toBe('i1');
  });

  it('should summarize changes', () => {
    const changes = [
      createChange('added', 'i1'),
      createChange('modified', 'i2'),
    ];
    const summary = summarizeChanges(changes);
    expect(summary.total).toBe(2);
    expect(summary.added).toBe(1);
  });

  it('should render change summary', () => {
    const summary = { total: 10, added: 3, modified: 4, removed: 3 };
    const output = renderChangeSummary(summary, 60);
    expect(output.length).toBeGreaterThan(0);
  });

  it('should clear old changes', () => {
    const tracker = new ChangeTracker();
    const oldTime = Date.now() - 10000;
    tracker.trackChange(createChange('added', 'old', { timestamp: oldTime }));
    tracker.trackChange(createChange('added', 'new'));
    
    tracker.clearOldChanges(5000);
    expect(tracker.hasChanges('old')).toBe(false);
    expect(tracker.hasChanges('new')).toBe(true);
  });
});
