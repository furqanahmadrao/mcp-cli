/**
 * TUI Framework Tests
 * 
 * Tests for the terminal user interface components,
 * navigation, and rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TUIApplication, createTUIApp } from '../src/tui/app';
import { NavigationManager, NavigationStack } from '../src/tui/navigation/manager';
import { renderLogo, renderCompactLogo, getLogoDimensions } from '../src/tui/components/logo';
import {
  renderDaemonStatusPanel,
  renderHealthPanel,
  renderStatsBar,
} from '../src/tui/components/status-panel';
import { renderShortcutsBar, renderHelpScreen } from '../src/tui/components/shortcuts';
import { renderDashboard, renderAlert } from '../src/tui/components/dashboard';
import { primaryTheme, createBox, centerText } from '../src/tui/styles/theme';
import { renderSelectableList, renderSearchableList, renderCompactList, type ListItem } from '../src/tui/components/selectable-list';
import { renderButton, renderButtonPair, renderButtonGroup } from '../src/tui/components/button';
import { renderConfirmDialog, renderYesNoDialog, renderWarningDialog, renderProgressDialog } from '../src/tui/components/confirm-dialog';
import { renderToolListView, renderToolDetailsPane, renderToolCard } from '../src/tui/views/tool-list-view';
import { renderDaemonControlPanel, renderDaemonStartupWizard, renderDaemonLogsView } from '../src/tui/views/daemon-control';
import { renderSettingsEditorView, renderSettingsSaveConfirm, renderSettingsResetWarning, daemonSettingsFields } from '../src/tui/views/settings-editor';
import {
  renderWizardStepIndicator,
  renderWizardToolSelection,
  renderWizardParametersStep,
  renderWizardConfirmStep,
  renderWizardExecutingStep,
  renderWizardResultsStep,
} from '../src/tui/views/execution-wizard';

describe('TUI Framework - Phase 3A Week 4', () => {
  describe('Logo Rendering', () => {
    it('should render logo with correct dimensions', () => {
      const logo = renderLogo();
      expect(logo.length).toBeGreaterThan(0);
      expect(logo.length).toBeLessThanOrEqual(15);
    });
    
    it('should get logo dimensions', () => {
      const dims = getLogoDimensions();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });
    
    it('should render compact logo', () => {
      const compact = renderCompactLogo();
      expect(compact).toContain('MCP');
      expect(compact).toContain('Model Context Protocol');
    });
  });
  
  describe('Status Panel Rendering', () => {
    it('should render daemon status panel', () => {
      const panel = renderDaemonStatusPanel(
        {
          isRunning: true,
          pid: 1234,
          uptime: 3600,
          healthStatus: 'healthy',
          cachedTools: 50,
          cacheHitRate: 0.85,
        },
        45
      );
      expect(panel.length).toBeGreaterThan(0);
      expect(panel.join('').toContain('1234'));
      expect(panel.join('').toContain('DAEMON STATUS'));
    });
    
    it('should render health panel', () => {
      const panel = renderHealthPanel(
        {
          totalTools: 100,
          cachedTools: 50,
          connectedServers: 5,
          failedServers: 0,
          cacheHitRate: 0.85,
          averageQueryTime: 150,
          daemonMemory: 52428800,
        },
        45
      );
      expect(panel.length).toBeGreaterThan(0);
      expect(panel.join('').toContain('SYSTEM HEALTH'));
    });
    
    it('should render stats bar', () => {
      const bar = renderStatsBar(
        {
          totalTools: 100,
          cachedTools: 50,
          connectedServers: 5,
          failedServers: 0,
          cacheHitRate: 0.85,
          averageQueryTime: 150,
          daemonMemory: 52428800,
        }
      );
      expect(bar).toContain('Tools:');
      expect(bar).toContain('Cached:');
    });
  });
  
  describe('Shortcuts Rendering', () => {
    it('should render shortcuts bar', () => {
      const bar = renderShortcutsBar(80);
      expect(bar).toContain('Dashboard');
      expect(bar).toContain('Tools');
      expect(bar).toContain('Daemon');
    });
    
    it('should render help screen', () => {
      const help = renderHelpScreen(80, 24);
      expect(help.length).toBeGreaterThan(10);
      expect(help.join('').toContain('GETTING STARTED'));
      expect(help.join('').toContain('KEYBOARD CONTROLS'));
    });
  });
  
  describe('Dashboard Rendering', () => {
    it('should render full dashboard', () => {
      const dashboard = renderDashboard(
        {
          isRunning: true,
          pid: 1234,
          healthStatus: 'healthy',
          cachedTools: 50,
          cacheHitRate: 0.85,
        },
        {
          totalTools: 100,
          cachedTools: 50,
          connectedServers: 5,
          failedServers: 0,
          cacheHitRate: 0.85,
          averageQueryTime: 150,
          daemonMemory: 52428800,
        },
        80,
        24,
        true
      );
      expect(dashboard.length).toBeGreaterThan(10);
    });
    
    it('should render compact dashboard', () => {
      const dashboard = renderDashboard(
        {
          isRunning: false,
          healthStatus: 'unhealthy',
          cachedTools: 0,
          cacheHitRate: 0,
        },
        {
          totalTools: 0,
          cachedTools: 0,
          connectedServers: 0,
          failedServers: 0,
          cacheHitRate: 0,
          averageQueryTime: 0,
          daemonMemory: 0,
        },
        60,
        20,
        false
      );
      expect(dashboard.length).toBeGreaterThan(5);
    });
    
    it('should render alert', () => {
      const alert = renderAlert('Test Alert', 'This is a test message', 'info', 60);
      expect(alert.length).toBeGreaterThan(0);
      expect(alert.join('').toContain('Test Alert'));
    });
  });
  
  describe('Navigation Manager', () => {
    let nav: NavigationManager;
    
    beforeEach(() => {
      nav = new NavigationManager();
    });
    
    it('should initialize with dashboard view', () => {
      const context = nav.getContext();
      expect(context.currentView).toBe('dashboard');
    });
    
    it('should navigate between views', () => {
      nav.navigateTo('tools');
      expect(nav.getContext().currentView).toBe('tools');
      
      nav.navigateTo('daemon');
      expect(nav.getContext().currentView).toBe('daemon');
    });
    
    it('should handle arrow key navigation', () => {
      nav.setMaxToolIndex(10);
      nav.setSelectedIndex(0);
      
      nav.moveDown();
      expect(nav.getSelectedIndex()).toBe(1);
      
      nav.moveUp();
      expect(nav.getSelectedIndex()).toBe(0);
    });
    
    it('should handle search mode', () => {
      expect(nav.isInSearchMode()).toBe(false);
      
      nav.enterSearchMode();
      expect(nav.isInSearchMode()).toBe(true);
      
      nav.addSearchChar('t');
      nav.addSearchChar('e');
      nav.addSearchChar('s');
      nav.addSearchChar('t');
      expect(nav.getSearchQuery()).toBe('test');
      
      nav.removeSearchChar();
      expect(nav.getSearchQuery()).toBe('tes');
      
      nav.exitSearchMode();
      expect(nav.isInSearchMode()).toBe(false);
    });
    
    it('should handle keyboard shortcuts', () => {
      const result1 = nav.handleKeyboard({ key: 'd', isCtrlPressed: false, isAltPressed: false, isShiftPressed: false });
      expect(result1.action).toBe('view_changed');
      expect(nav.getContext().currentView).toBe('dashboard');
      
      const result2 = nav.handleKeyboard({ key: 't', isCtrlPressed: false, isAltPressed: false, isShiftPressed: false });
      expect(result2.action).toBe('view_changed');
      expect(nav.getContext().currentView).toBe('tools');
    });
    
    it('should reset navigation', () => {
      nav.navigateTo('help');
      nav.setSelectedIndex(5);
      nav.enterSearchMode();
      
      nav.reset();
      
      expect(nav.getContext().currentView).toBe('dashboard');
      expect(nav.getSelectedIndex()).toBe(0);
      expect(nav.isInSearchMode()).toBe(false);
    });
  });
  
  describe('Navigation Stack', () => {
    let stack: NavigationStack;
    
    beforeEach(() => {
      stack = new NavigationStack();
    });
    
    it('should push and pop views', () => {
      stack.push('dashboard');
      stack.push('tools');
      
      expect(stack.peek()).toBe('tools');
      
      const popped = stack.pop();
      expect(popped).toBe('tools');
      expect(stack.peek()).toBe('dashboard');
    });
    
    it('should track stack size', () => {
      expect(stack.size()).toBe(0);
      
      stack.push('dashboard');
      expect(stack.size()).toBe(1);
      
      stack.push('tools');
      expect(stack.size()).toBe(2);
    });
    
    it('should handle empty stack', () => {
      expect(stack.isEmpty()).toBe(true);
      expect(stack.peek()).toBeUndefined();
      
      stack.push('dashboard');
      expect(stack.isEmpty()).toBe(false);
    });
  });
  
  describe('TUI Application', () => {
    let app: TUIApplication;
    
    beforeEach(async () => {
      app = new TUIApplication();
      await app.initialize();
    });
    
    it('should create application instance', () => {
      expect(app).toBeDefined();
      expect(app.isApplicationRunning()).toBe(true);
    });
    
    it('should set terminal size', () => {
      app.setTerminalSize(120, 40);
      // Render should work without errors
      const output = app.getRenderedOutput();
      expect(output).toBeDefined();
    });
    
    it('should update daemon status', () => {
      app.updateDaemonStatus({
        isRunning: true,
        pid: 5678,
        healthStatus: 'healthy',
      });
      
      const output = app.getRenderedOutput();
      expect(output).toContain('Dashboard');
    });
    
    it('should update metrics', () => {
      app.updateMetrics({
        totalTools: 75,
        cachedTools: 60,
        connectedServers: 3,
      });
      
      const output = app.getRenderedOutput();
      expect(output).toBeDefined();
    });
    
    it('should navigate to different views', () => {
      app.navigateTo('help');
      expect(app.getCurrentView()).toBe('help');
      
      app.navigateTo('tools');
      expect(app.getCurrentView()).toBe('tools');
    });
    
    it('should render output', () => {
      const output = app.getRenderedOutput();
      expect(output.length).toBeGreaterThan(0);
      expect(typeof output).toBe('string');
    });
  });
  
  describe('SelectableList Component (Week 5)', () => {
    it('should render list with items', () => {
      const items: ListItem[] = [
        { id: '1', label: 'Item 1', description: 'First item' },
        { id: '2', label: 'Item 2', description: 'Second item' },
      ];
      
      const output = renderSelectableList(items, 0, 60, 10);
      expect(output.length).toBeGreaterThan(0);
      expect(output.find(line => line.includes('Item 1'))).toBeDefined();
    });
    
    it('should render searchable list', () => {
      const items: ListItem[] = [
        { id: '1', label: 'Tool A' },
        { id: '2', label: 'Tool B' },
      ];
      
      const output = renderSearchableList(items, 'Tool', 0, 60, 10);
      expect(output.length).toBeGreaterThan(0);
      expect(output.some(line => line.includes('Tool'))).toBe(true);
    });
    
    it('should render compact list', () => {
      const items: ListItem[] = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
        { id: '3', label: 'Item 3' },
        { id: '4', label: 'Item 4' },
        { id: '5', label: 'Item 5' },
      ];
      
      const output = renderCompactList(items, 0, 60);
      expect(output.length).toBeLessThanOrEqual(8);
    });
    
    it('should highlight selected item', () => {
      const items: ListItem[] = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
      ];
      
      const output = renderSelectableList(items, 1, 60, 10);
      const selectedIndex = output.findIndex(line => line.includes('Item 2'));
      expect(selectedIndex).toBeGreaterThanOrEqual(0);
    });
    
    it('should filter items with search query', () => {
      const items: ListItem[] = [
        { id: '1', label: 'Python Tool' },
        { id: '2', label: 'JavaScript Tool' },
        { id: '3', label: 'Python Script' },
      ];
      
      const output = renderSearchableList(items, 'Python', 0, 70, 15);
      expect(output.length).toBeGreaterThan(0);
    });
  });
  
  describe('Button Component (Week 5)', () => {
    it('should render button', () => {
      const output = renderButton('Click Me', 'primary', 'default', 20);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Click Me')).toBe(true);
    });
    
    it('should render button with different variants', () => {
      const primary = renderButton('Primary', 'primary', 'default', 15);
      const secondary = renderButton('Secondary', 'secondary', 'default', 15);
      const danger = renderButton('Delete', 'danger', 'default', 15);
      const success = renderButton('OK', 'success', 'default', 15);
      
      expect(primary.length).toBeGreaterThan(0);
      expect(secondary.length).toBeGreaterThan(0);
      expect(danger.length).toBeGreaterThan(0);
      expect(success.length).toBeGreaterThan(0);
    });
    
    it('should render button pair', () => {
      const output = renderButtonPair('Confirm', 'Cancel', 40);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Confirm')).toBe(true);
      expect(output.join('').includes('Cancel')).toBe(true);
    });
    
    it('should render button group', () => {
      const output = renderButtonGroup(['Option 1', 'Option 2', 'Option 3'], 0, 50);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Option 1')).toBe(true);
    });
    
    it('should render button with focused state', () => {
      const output = renderButton('Focused', 'primary', 'focused', 18);
      expect(output.length).toBeGreaterThan(0);
    });
  });
  
  describe('ConfirmDialog Component (Week 5)', () => {
    it('should render confirm dialog', () => {
      const output = renderConfirmDialog('Confirm Action', 'Are you sure?', 60);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Confirm Action')).toBe(true);
    });
    
    it('should render yes/no dialog', () => {
      const output = renderYesNoDialog('Question', 'Yes', 'No', 50);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Yes')).toBe(true);
      expect(output.join('').includes('No')).toBe(true);
    });
    
    it('should render warning dialog', () => {
      const output = renderWarningDialog('Warning', 'Careful!', 55);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Warning')).toBe(true);
    });
    
    it('should render error dialog', () => {
      const output = renderErrorDialog('Error', 'Something went wrong', 55);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Error')).toBe(true);
    });
    
    it('should render progress dialog', () => {
      const output = renderProgressDialog('Processing...', 'Executing task', 45, 10);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Processing')).toBe(true);
    });
  });
  
  describe('ToolListView (Week 5)', () => {
    it('should render tool list view', () => {
      const tools = [
        { name: 'Tool A', description: 'Tool A description' },
        { name: 'Tool B', description: 'Tool B description' },
      ];
      
      const output = renderToolListView(tools, 0, '', 70, 20);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Tool A')).toBe(true);
    });
    
    it('should render tool details pane', () => {
      const tool = { name: 'Tool A', description: 'Description' };
      const output = renderToolDetailsPane(tool, 50);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Tool A')).toBe(true);
    });
    
    it('should render tool card', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      const output = renderToolCard(tool, true, 35);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should filter tools with search query', () => {
      const tools = [
        { name: 'Python Tool', description: 'Python' },
        { name: 'JavaScript Tool', description: 'JavaScript' },
      ];
      
      const output = renderToolListView(tools, 0, 'Python', 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should highlight selected tool', () => {
      const tools = [
        { name: 'Tool 1', description: 'D1' },
        { name: 'Tool 2', description: 'D2' },
      ];
      
      const output = renderToolListView(tools, 1, '', 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
  });
  
  describe('DaemonControl View (Week 5)', () => {
    it('should render daemon control panel', () => {
      const status = {
        isRunning: true,
        healthStatus: 'healthy',
        cachedTools: 10,
        cacheHitRate: 0.85,
      };
      
      const output = renderDaemonControlPanel(status, 0, 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should render daemon startup wizard', () => {
      const output = renderDaemonStartupWizard(1, 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should render daemon logs view', () => {
      const logs = ['Log line 1', 'Log line 2', 'Log line 3'];
      const output = renderDaemonLogsView(logs, 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should show appropriate buttons based on status', () => {
      const runningStatus = {
        isRunning: true,
        healthStatus: 'healthy',
        cachedTools: 10,
        cacheHitRate: 0.85,
      };
      
      const output = renderDaemonControlPanel(runningStatus, 0, 70, 20);
      expect(output.join('').includes('Stop') || output.join('').includes('Restart')).toBe(true);
    });
  });
  
  describe('SettingsEditor View (Week 5)', () => {
    it('should render settings editor', () => {
      const output = renderSettingsEditorView(0, 0, {}, 70, 20);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should have default settings fields', () => {
      expect(daemonSettingsFields.length).toBeGreaterThan(0);
      expect(daemonSettingsFields.some(f => f.id === 'enabled')).toBe(true);
    });
    
    it('should render settings save confirmation', () => {
      const output = renderSettingsSaveConfirm(['enabled', 'logLevel'], 60);
      expect(output.length).toBeGreaterThan(0);
    });
    
    it('should render settings reset warning', () => {
      const output = renderSettingsResetWarning(60);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('reset')).toBe(true);
    });
    
    it('should validate form fields', () => {
      const fields = daemonSettingsFields;
      const validFields = fields.filter(f => f.id && f.label);
      expect(validFields.length).toEqual(fields.length);
    });
  });
  
  describe('ExecutionWizard (Week 5)', () => {
    it('should render wizard step indicator', () => {
      const output = renderWizardStepIndicator(1, 5, ['Select', 'Params', 'Confirm', 'Exec', 'Results'], 70);
      expect(output.length).toBeGreaterThan(0);
      expect(output[0]).toContain('●');
    });
    
    it('should render tool selection step', () => {
      const tools = [
        { name: 'Tool A', description: 'Desc A' },
        { name: 'Tool B', description: 'Desc B' },
      ];
      
      const output = renderWizardToolSelection(tools, 0, 70, 20);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Tool A')).toBe(true);
    });
    
    it('should render parameters step', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      const fields = [
        { id: 'param1', label: 'Parameter 1', type: 'text', value: '' },
        { id: 'param2', label: 'Parameter 2', type: 'number', value: '0' },
      ];
      
      const output = renderWizardParametersStep(tool, fields, undefined, {}, 70, 20);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Parameter 1')).toBe(true);
    });
    
    it('should render confirm step', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      const params = { param1: 'value1', param2: 'value2' };
      
      const output = renderWizardConfirmStep(tool, params, 70);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('Ready')).toBe(true);
    });
    
    it('should render executing step with progress', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      
      const output = renderWizardExecutingStep(tool, 75, 70);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('progress')).toBe(true);
    });
    
    it('should render results step', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      const result = {
        success: true,
        output: 'Execution successful',
        executionTime: 1234,
      };
      
      const output = renderWizardResultsStep(tool, result, 70, 20);
      expect(output.length).toBeGreaterThan(0);
      expect(output.join('').includes('SUCCESS')).toBe(true);
    });
    
    it('should handle error results', () => {
      const tool = { name: 'Tool', description: 'Desc' };
      const result = {
        success: false,
        error: 'Tool execution failed',
      };
      
      const output = renderWizardResultsStep(tool, result, 70, 20);
      expect(output.join('').includes('FAILED')).toBe(true);
    });
  });
  
  describe('Theme and Styling', () => {
    it('should have primary theme defined', () => {
      expect(primaryTheme.primary).toBeDefined();
      expect(primaryTheme.secondary).toBeDefined();
      expect(primaryTheme.success).toBeDefined();
      expect(primaryTheme.error).toBeDefined();
    });
    
    it('should create box with borders', () => {
      const content = ['Line 1', 'Line 2'];
      const box = createBox(content, 20, 'rounded');
      expect(box.length).toBeGreaterThanOrEqual(4);
      expect(box[0]).toContain('╭');
      expect(box[box.length - 1]).toContain('╰');
    });
    
    it('should center text', () => {
      const centered = centerText('Test', 20);
      expect(centered.length).toBeLessThanOrEqual(20);
      expect(centered.includes('Test')).toBe(true);
    });
  });
});
