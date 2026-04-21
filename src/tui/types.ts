/**
 * TUI (Terminal User Interface) Type Definitions
 * 
 * Defines types for the interactive dashboard, navigation,
 * status tracking, and user interactions.
 */

/**
 * Available views in the TUI application
 */
export type ViewType = 'menu' | 'dashboard' | 'stats' | 'servers' | 'doctor' | 'update' | 'tools' | 'daemon' | 'settings' | 'help';

/**
 * Daemon status information displayed in TUI
 */
export interface DaemonTUIStatus {
  isRunning: boolean;
  pid?: number;
  uptime?: number;
  lastHealthCheck?: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  cachedTools: number;
  cacheHitRate: number;
  memoryUsage?: number;
}

/**
 * Tool information for TUI display
 */
export interface ToolTUIInfo {
  name: string;
  description: string;
  server: string;
  category?: string;
  lastUsed?: Date;
  isCached: boolean;
}

/**
 * Navigation context for keyboard input handling
 */
export interface NavigationContext {
  currentView: ViewType;
  selectedToolIndex?: number;
  searchQuery?: string;
  isLoading: boolean;
  error?: string;
  menuLevel?: 'main' | 'servers'; // For hierarchical menus
}

/**
 * Keyboard input event
 */
export interface KeyboardInput {
  key: string;
  isCtrlPressed: boolean;
  isAltPressed: boolean;
  isShiftPressed: boolean;
}

/**
 * TUI Application state
 */
export interface TUIAppState {
  navigation: NavigationContext;
  daemon: DaemonTUIStatus;
  tools: ToolTUIInfo[];
  viewHistory: ViewType[];
}

/**
 * Theme colors for TUI
 */
export interface TUITheme {
  primary: string;        // Orange for primary focus
  secondary: string;      // Black/dark for secondary
  success: string;        // Green for success states
  warning: string;        // Yellow for warnings
  error: string;          // Red for errors
  text: string;           // White/light text
  muted: string;          // Gray for muted text
}

/**
 * Component render props
 */
export interface ComponentProps {
  width?: number;
  height?: number;
  theme: TUITheme;
  onKeyboard?: (input: KeyboardInput) => void;
}

/**
 * Dashboard metrics snapshot
 */
export interface DashboardMetrics {
  totalTools: number;
  cachedTools: number;
  connectedServers: number;
  failedServers: number;
  cacheHitRate: number;
  averageQueryTime: number;
  daemonMemory: number;
}
