/**
 * Interactive TUI Components Tests
 * 
 * Tests for tool list, daemon control, settings editor, and execution wizard.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderToolListView,
  filterTools,
  sortTools,
  groupToolsByServer,
  getToolStats,
} from '../src/tui/components/tool-list';
import {
  renderDaemonControlPanel,
  getAvailableActions,
  createActionResultMessage,
} from '../src/tui/components/daemon-control';
import {
  renderSettingsEditorView,
  createSettingsFormFields,
  validateSettings,
} from '../src/tui/components/settings-editor';
import {
  renderToolSelectionStep,
  renderParametersStep,
  renderConfirmationStep,
  renderExecutingStep,
  renderResultsStep,
  getWizardProgress,
  renderWizardSteps,
} from '../src/tui/components/execution-wizard';
import {
  renderFormInput,
  renderFormFields,
  validateFormFields,
  getFormValues,
  updateFormField,
} from '../src/tui/components/form-input';
import {
  renderSelectableList,
  renderCompactList,
  ListNavigator,
} from '../src/tui/components/list-view';
import { ToolTUIInfo, DaemonTUIStatus } from '../src/tui/types';
import { ExtendedDaemonConfig } from '../src';

describe('Interactive TUI Components - Phase 3A Week 5', () => {
  describe('Form Input Component', () => {
    it('should render text input field', () => {
      const field = {
        name: 'toolName',
        label: 'Tool Name',
        type: 'text' as const,
        value: 'test-tool',
      };
      
      const lines = renderFormInput(field, 50);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.join('').toContain('Tool Name'));
    });
    
    it('should render select input field', () => {
      const field = {
        name: 'level',
        label: 'Log Level',
        type: 'select' as const,
        value: 'debug',
        options: [
          { label: 'Debug', value: 'debug' },
          { label: 'Info', value: 'info' },
        ],
      };
      
      const lines = renderFormInput(field, 50);
      expect(lines.join('').toContain('Log Level'));
    });
    
    it('should validate required fields', () => {
      const field = {
        name: 'email',
        label: 'Email',
        type: 'text' as const,
        value: '',
        required: true,
      };
      
      const errors = validateFormFields([field]);
      expect(errors.email).toBeDefined();
    });
    
    it('should update form field values', () => {
      let fields = [
        { name: 'test', label: 'Test', type: 'text' as const, value: 'old' },
      ];
      
      fields = updateFormField(fields, 'test', 'new');
      expect(fields[0].value).toBe('new');
    });
  });
  
  describe('Tool List Component', () => {
    let tools: ToolTUIInfo[];
    
    beforeEach(() => {
      tools = [
        {
          name: 'tool-a',
          description: 'First tool',
          server: 'server1',
          isCached: true,
        },
        {
          name: 'tool-b',
          description: 'Second tool',
          server: 'server2',
          isCached: false,
        },
        {
          name: 'tool-c',
          description: 'Third tool',
          server: 'server1',
          isCached: true,
        },
      ];
    });
    
    it('should render tool list view', () => {
      const view = renderToolListView(tools, 0, '', 80, 24);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('AVAILABLE TOOLS'));
    });
    
    it('should filter tools by search query', () => {
      const filtered = filterTools(tools, 'tool-a');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('tool-a');
    });
    
    it('should sort tools', () => {
      const sorted = sortTools(tools, 'name');
      expect(sorted[0].name).toBe('tool-a');
      expect(sorted[2].name).toBe('tool-c');
    });
    
    it('should group tools by server', () => {
      const grouped = groupToolsByServer(tools);
      expect(grouped.size).toBe(2);
      expect(grouped.get('server1')?.length).toBe(2);
    });
    
    it('should get tool statistics', () => {
      const stats = getToolStats(tools);
      expect(stats.total).toBe(3);
      expect(stats.cached).toBe(2);
      expect(stats.servers).toBe(2);
    });
  });
  
  describe('Daemon Control Component', () => {
    let status: DaemonTUIStatus;
    
    beforeEach(() => {
      status = {
        isRunning: true,
        pid: 1234,
        uptime: 3600,
        healthStatus: 'healthy',
        cachedTools: 50,
        cacheHitRate: 0.85,
      };
    });
    
    it('should render daemon control panel', () => {
      const view = renderDaemonControlPanel(status, 0, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('DAEMON CONTROL'));
    });
    
    it('should get available actions for running daemon', () => {
      const actions = getAvailableActions(status);
      expect(actions.some(a => a.id === 'stop')).toBe(true);
      expect(actions.find(a => a.id === 'stop')?.enabled).toBe(true);
    });
    
    it('should get available actions for stopped daemon', () => {
      status.isRunning = false;
      const actions = getAvailableActions(status);
      expect(actions.find(a => a.id === 'start')?.enabled).toBe(true);
      expect(actions.find(a => a.id === 'stop')?.enabled).toBe(false);
    });
    
    it('should create action result message', () => {
      const message = createActionResultMessage('start', true);
      expect(message).toContain('Started');
      expect(message).toContain('✓');
    });
  });
  
  describe('Settings Editor Component', () => {
    let config: ExtendedDaemonConfig;
    
    beforeEach(() => {
      config = {
        basic: { enabled: true, autoStart: false },
        logging: {
          level: 'info',
          maxFileSize: 52428800,
          maxFiles: 10,
          retentionDays: 7,
        },
        health: { checkInterval: 30000 },
        discovery: { cacheInterval: 300000, cacheTTL: 300000 },
        advanced: { gracefulShutdownTimeout: 10000 },
      };
    });
    
    it('should create settings form fields', () => {
      const fields = createSettingsFormFields(config);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(f => f.name === 'enabled')).toBe(true);
    });
    
    it('should render settings editor', () => {
      const fields = createSettingsFormFields(config);
      const view = renderSettingsEditorView(fields, 0, {}, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('SETTINGS'));
    });
    
    it('should validate settings', () => {
      const fields = createSettingsFormFields(config);
      const errors = validateSettings(fields);
      // No required fields, so should be valid
      expect(Object.keys(errors).length).toBe(0);
    });
  });
  
  describe('Execution Wizard Component', () => {
    let tool: ToolTUIInfo;
    
    beforeEach(() => {
      tool = {
        name: 'execute-tool',
        description: 'A tool to execute',
        server: 'test-server',
        isCached: true,
      };
    });
    
    it('should render wizard steps', () => {
      const steps = renderWizardSteps('tool', 80);
      expect(steps).toContain('●');
      expect(steps).toContain('Select Tool');
    });
    
    it('should render tool selection step', () => {
      const tools = [tool];
      const view = renderToolSelectionStep(tools, 0, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('EXECUTION WIZARD'));
    });
    
    it('should render parameters step', () => {
      const params = [];
      const view = renderParametersStep(tool, params, {}, 0, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('PARAMETERS'));
    });
    
    it('should render confirmation step', () => {
      const view = renderConfirmationStep(tool, [], {}, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('EXECUTION DETAILS'));
    });
    
    it('should render executing step', () => {
      const view = renderExecutingStep(tool, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('EXECUTION IN PROGRESS'));
    });
    
    it('should render results step', () => {
      const view = renderResultsStep(tool, 'Success result', undefined, 80);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('✓'));
    });
    
    it('should calculate wizard progress', () => {
      const progress = getWizardProgress('params');
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });
  
  describe('List View Component', () => {
    it('should render selectable list', () => {
      const items = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
      ];
      
      const view = renderSelectableList(items, 0, 5, 60);
      expect(view.length).toBeGreaterThan(0);
      expect(view.join('').toContain('Item 1'));
    });
    
    it('should render compact list', () => {
      const items = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
      ];
      
      const view = renderCompactList(items, 0, 3, 50);
      expect(view.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should navigate list items', () => {
      const items = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
        { id: '3', label: 'Item 3' },
      ];
      
      const navigator = new ListNavigator(items);
      expect(navigator.getSelectedIndex()).toBe(0);
      
      navigator.moveDown();
      expect(navigator.getSelectedIndex()).toBe(1);
      
      navigator.moveUp();
      expect(navigator.getSelectedIndex()).toBe(0);
    });
    
    it('should jump to list ends', () => {
      const items = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
        { id: '3', label: 'Item 3' },
      ];
      
      const navigator = new ListNavigator(items);
      navigator.end();
      expect(navigator.getSelectedIndex()).toBe(2);
      
      navigator.home();
      expect(navigator.getSelectedIndex()).toBe(0);
    });
  });
});
