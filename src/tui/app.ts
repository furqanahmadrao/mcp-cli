/**
 * Main TUI Application
 * 
 * Simplified terminal user interface focused on server management and core features.
 * Eliminates dashboard clutter and improves performance through optimized rendering.
 */

import { EventEmitter } from 'events';
import { ViewType } from './types.js';
import { NavigationManager } from './navigation/manager.js';
import { parseKeypress } from './utils/keyboard-parser.js';
import { ConfigService, getConfigService, ServerConfig } from './services/config-service.js';
import {
  renderHelpScreen,
} from './components/shortcuts.js';
import { 
  renderMenu, 
  getMenuItemAtIndex,
} from './components/menu.js';
import { renderDoctorView } from './views/doctor-view.js';
import { renderUpdateView } from './views/update-view.js';
import { renderServersView } from './views/servers-view.js';
import {
  renderAddServerForm,
  handleAddServerFormInput,
  createAddServerFormState,
  extractServerConfig,
  AddServerFormState,
} from './views/add-server-form.js';
import { renderConfirmDialog } from './components/confirm-dialog.js';
import { renderHeader } from './components/logo.js';
import { BRIGHT_ORANGE, RESET, BOLD } from './theme.js';

/**
 * Form state union type
 */
type FormState = AddServerFormState | { type: 'confirm-remove'; serverName: string; selectedOK: boolean } | null;

/**
 * Main TUI Application class
 */
export class TUIApplication extends EventEmitter {
  private nav: NavigationManager;
  private configService: ConfigService;
  private servers: ServerConfig[] = [];
  
  private terminalWidth: number = 80;
  private terminalHeight: number = 24;
  private isRunning: boolean = false;
  
  // Form state management
  private formState: FormState = null;
  private formMode: 'none' | 'add-server' | 'remove-server' | 'update-server' = 'none';
  
  /**
   * Constructor
   */
  constructor() {
    super();
    this.nav = new NavigationManager('menu');
    this.configService = getConfigService();
  }
  
  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    this.isRunning = true;
    
    // Load configuration
    await this.configService.load();
    this.servers = this.configService.getServers();
    
    this.emit('initialized');
  }
  
  /**
   * Shutdown the application
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    this.emit('shutdown');
  }
  
  /**
   * Handle keyboard input - Pure navigation driven
   */
  handleInput(key: string): void {
    const parsed = parseKeypress(key);
    if (!parsed) return;

    // Handle form input if form is active
    if (this.formState !== null) {
      this.handleFormInput(parsed.name);
      return;
    }

    const input = {
      key: parsed.name,
      isCtrlPressed: parsed.isCtrlPressed,
      isAltPressed: parsed.isAltPressed,
      isShiftPressed: false,
    };

    const context = this.nav.getContext();
    
    // Handle global keys FIRST
    if (parsed.name === 'q' || parsed.name === 'Q') {
      this.shutdown();
      return;
    }
    
    // Set max index for list navigation
    if (context.currentView === 'menu') {
      const menuLevel = context.menuLevel || 'main';
      const count = menuLevel === 'main' ? 5 : 4;
      this.nav.setMaxToolIndex(count);
    } else if (context.currentView === 'servers') {
      this.nav.setMaxToolIndex(this.servers.length);
    }
    
    const result = this.nav.handleKeyboard(input);
    
    // Handle Enter selection
    if (parsed.name === 'enter') {
      if (context.currentView === 'menu') {
        this.handleMenuSelection();
      } else if (context.currentView === 'servers') {
        this.startUpdateServerForm();
      }
    }
    
    if (result.action === 'quit') {
      this.shutdown();
      return;
    }
    
    this.emit('input', { key: parsed.name, action: result.action });
  }

  /**
   * Handle form input
   */
  private handleFormInput(key: string): void {
    if (!this.formState) return;

    // Add/Update Server Form
    if (this.formMode === 'add-server' || this.formMode === 'update-server') {
      if (key === 'escape') {
        this.formState = null;
        this.formMode = 'none';
      } else {
        const result = handleAddServerFormInput(this.formState as AddServerFormState, key);
        this.formState = result.state;
        
        if (result.action === 'submit') {
          const config = extractServerConfig(result.state);
          if (this.formMode === 'add-server') {
            this.configService.addServer(config).then(() => {
              this.finishForm();
            });
          } else {
            this.configService.updateServer(config.name, config).then(() => {
              this.finishForm();
            });
          }
        } else if (result.action === 'cancel') {
          this.formState = null;
          this.formMode = 'none';
        }
      }
    } 
    // Remove Confirmation
    else if (this.formMode === 'remove-server') {
      const state = this.formState as any;
      if (key === 'arrowleft' || key === 'arrowright') {
        state.selectedOK = !state.selectedOK;
      } else if (key === 'enter') {
        if (state.selectedOK) {
          this.configService.removeServer(state.serverName).then(() => {
            this.finishForm();
          });
        } else {
          this.formState = null;
          this.formMode = 'none';
        }
      } else if (key === 'escape') {
        this.formState = null;
        this.formMode = 'none';
      }
    }
  }

  private finishForm() {
    this.formState = null;
    this.formMode = 'none';
    this.configService.load().then(cfg => {
      this.servers = cfg.servers;
    });
  }

  /**
   * Handle menu selection
   */
  private handleMenuSelection(): void {
    const context = this.nav.getContext();
    const menuLevel = context.menuLevel || 'main';
    const selectedIndex = context.selectedToolIndex || 0;
    
    const selectedItem = getMenuItemAtIndex(selectedIndex, menuLevel);
    if (!selectedItem) return;

    // Navigation submenus
    if (selectedItem.submenu) {
      this.nav.setMenuLevel(selectedItem.submenu as 'servers');
      if (selectedItem.submenu === 'servers') {
        this.nav.navigateTo('servers');
      }
      return;
    }

    // Direct actions from menu
    if (selectedItem.id === 'quit') {
      this.shutdown();
    } else if (selectedItem.id === 'doctor') {
      this.nav.navigateTo('doctor');
    } else if (selectedItem.id === 'update') {
      this.nav.navigateTo('update');
    } else if (selectedItem.id === 'help') {
      this.nav.navigateTo('help');
    } else if (selectedItem.id === 'back') {
      this.nav.setMenuLevel('main');
      this.nav.navigateTo('menu');
    }
    
    // Server operations from the submenu
    else if (menuLevel === 'servers') {
      if (selectedItem.id === 'add-server') {
        this.startAddServerForm();
      } else if (selectedItem.id === 'remove-server') {
        this.startRemoveServerConfirm();
      } else if (selectedItem.id === 'update-server') {
        this.startUpdateServerForm();
      }
    }
  }

  private startAddServerForm(): void {
    this.formMode = 'add-server';
    this.formState = createAddServerFormState();
  }

  private startRemoveServerConfirm(): void {
    const index = this.nav.getSelectedIndex();
    const server = this.servers[index];
    
    if (!server) {
      this.nav.navigateTo('servers');
      return;
    }

    this.formMode = 'remove-server';
    this.formState = {
      type: 'confirm-remove',
      serverName: server.name,
      selectedOK: false
    } as any;
  }

  private startUpdateServerForm(): void {
    const index = this.nav.getSelectedIndex();
    const server = this.servers[index];
    
    if (!server) {
      this.nav.navigateTo('servers');
      return;
    }

    this.formMode = 'update-server';
    const state = createAddServerFormState();
    state.name = server.name;
    state.type = server.type;
    state.command = server.command || '';
    state.url = server.url || '';
    if (server.auth) {
      state.authType = server.auth.type as any;
      if ('token' in server.auth) state.bearerToken = (server.auth as any).token;
    }
    this.formState = state;
  }

  /**
   * Render the current view
   */
  render(): string[] {
    const lines: string[] = [];
    const context = this.nav.getContext();
    const width = this.terminalWidth;
    const effectiveWidth = Math.min(width, 100);

    // Form takes precedence (Forms usually have their own structure)
    if (this.formState !== null) {
      if (this.formMode === 'add-server' || this.formMode === 'update-server') {
        lines.push(...renderAddServerForm(this.formState as AddServerFormState));
      } else if (this.formMode === 'remove-server') {
        const state = this.formState as any;
        lines.push(...renderConfirmDialog({
          title: 'REMOVE SERVER',
          message: `Are you sure you want to remove server "${state.serverName}"?`,
          okText: 'Remove',
          isDangerous: true
        }, state.selectedOK, this.terminalWidth - 10));
      }
      return lines;
    }

    // Common layout header
    let viewTitle = 'MAIN MENU';
    switch (context.currentView) {
      case 'menu': 
        viewTitle = context.menuLevel === 'servers' ? 'MANAGE MCP SERVERS' : 'MAIN MENU';
        break;
      case 'doctor': viewTitle = 'SYSTEM DIAGNOSIS'; break;
      case 'update': viewTitle = 'VERSION & UPDATES'; break;
      case 'servers': viewTitle = 'MCP SERVERS'; break;
      case 'help': viewTitle = 'HELP & DOCUMENTATION'; break;
    }

    lines.push(...renderHeader(viewTitle, width));
    lines.push('');

    // Content area
    switch (context.currentView) {
      case 'menu':
        lines.push(...renderMenu(context.selectedToolIndex || 0, width, this.terminalHeight, context.menuLevel || 'main'));
        break;

      case 'doctor':
        lines.push(...renderDoctorView(this.servers.length, width, this.terminalHeight));
        break;
      
      case 'update':
        lines.push(...renderUpdateView(width, this.terminalHeight));
        break;
      
      case 'servers':
        lines.push(...renderServersView(this.servers, context.selectedToolIndex || 0, width, this.terminalHeight));
        break;
      
      case 'help':
        lines.push(...renderHelpScreen(width, this.terminalHeight));
        break;

      default:
        lines.push('Unknown view: ' + context.currentView);
    }
    
    // Check if the last line is a footer (separator line + text)
    // If not, we could add a unified one here. 
    // But for now, we'll let the views handle their own footers to avoid duplicate lines.
    
    return lines;
  }
  
  /**
   * Set terminal dimensions
   */
  setTerminalSize(width: number, height: number): void {
    this.terminalWidth = width;
    this.terminalHeight = height;
  }
  
  /**
   * Get rendered output as string
   */
  getRenderedOutput(): string {
    return this.render().join('\n');
  }
  
  /**
   * Check if application is running
   */
  isApplicationRunning(): boolean {
    return this.isRunning;
  }
}
