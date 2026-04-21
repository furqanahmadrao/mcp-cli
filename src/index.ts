/**
 * mcpcli - MCP Gateway CLI Client
 * Main exports
 */

export { GatewayCoordinator } from "./gateway/coordinator.js";
export { ToolRegistry } from "./gateway/tool-registry.js";
export { ServerRegistry, createRegistryFromConfigs } from "./gateway/server-registry.js";
export { loadConfig, loadConfigWithProfile } from "./config/loader.js";
export {
    McpcliError,
    ConfigError,
    ConnectionError,
    ToolNotFoundError,
    InvalidInputError,
    ExecutionError,
    AmbiguousToolError,
    ErrorType,
} from "./errors/custom-errors.js";
export { getRecoveryHint, formatRecoveryHint } from "./errors/recovery-hints.js";
export {
    detectAmbiguousTools,
    suggestToolQualification,
    resolveToolName,
    findCloseToolMatches,
} from "./gateway/tool-disambiguation.js";
export {
    discoverToolsGracefully,
    executeToolGracefully,
    clearDiscoveryCache,
    getCacheStats,
    withGracefulFailures,
} from "./gateway/graceful-failures.js";
export {
    attachErrorContext,
    getErrorContext,
    hasErrorContext,
    formatErrorWithContext,
    createErrorMessage,
    ErrorWithContext,
    wrapErrorWithContext,
    safeGetErrorContext,
    summarizeErrors,
} from "./errors/error-context.js";
export {
    createHealthCommand,
    determineHealthStatus,
    generateRecommendations,
    getOverallStatus,
    formatHealthCheckResult,
} from "./cli/commands/health.js";
export { handleHealthCheck, formatHealthCheckAsJSON, formatHealthCheckAsTable } from "./cli/handlers/health.js";
export { createDaemonCommand } from "./cli/commands/daemon.js";
export {
    handleDaemonStart,
    handleDaemonStop,
    handleDaemonRestart,
    handleDaemonStatus,
    handleDaemonLogs,
    handleDaemonCommand,
} from "./cli/handlers/daemon.js";
export { DaemonService } from "./daemon/daemon-service.js";
export { DaemonManager } from "./daemon/daemon-manager.js";
export {
    DaemonConfig,
    DEFAULT_DAEMON_CONFIG,
    getDaemonDir,
    getDaemonPidFile,
    getDaemonLogFile,
    getDaemonSocket,
    getCacheDir,
    validateDaemonConfig,
    isDaemonEnabled,
    isDaemonAutoStart,
} from "./daemon/daemon-config.js";
export {
    DaemonClient,
    getDaemonClient,
    resetDaemonClient,
} from "./daemon/daemon-client.js";
export type {
    DaemonRequest,
    DaemonResponse,
    CachedTools,
    DaemonMetrics,
} from "./daemon/daemon-client.js";
export {
    CacheManager,
    getCacheManager,
    resetCacheManager,
} from "./daemon/cache-manager.js";
export type {
    CacheEntry,
    CacheStats,
} from "./daemon/cache-manager.js";
export {
    HealthPoller,
    getHealthPoller,
    resetHealthPoller,
} from "./daemon/health-poller.js";
export type {
    PollerConfig,
    PollerStatus,
    PollerEvent,
} from "./daemon/health-poller.js";
export {
    DaemonLogger,
    createLogger,
} from "./daemon/daemon-logger.js";
export type {
    LogLevel,
    LogEntry,
    LoggerConfig,
} from "./daemon/daemon-logger.js";
export {
    detectPlatform,
    getPlatformName,
    createPlatformManager,
    getSocketType,
    supportsAutoStart,
    supportsNativeLogging,
    getPlatformInfo,
    checkPlatformRequirements,
    formatPathForDisplay,
    getDaemonCommand,
} from "./daemon/platform-manager.js";
export type {
    Platform,
    PlatformManager,
} from "./daemon/platform-manager.js";
export {
    WindowsPlatformManager,
    createWindowsManager,
} from "./daemon/platform-windows.js";
export type {
    WindowsDaemonConfig,
} from "./daemon/platform-windows.js";
export {
    MacOSPlatformManager,
    createMacOSManager,
} from "./daemon/platform-macos.js";
export type {
    MacOSDaemonConfig,
} from "./daemon/platform-macos.js";
export {
    LinuxPlatformManager,
    createLinuxManager,
} from "./daemon/platform-linux.js";
export type {
    LinuxDaemonConfig,
} from "./daemon/platform-linux.js";
export {
    createExtendedConfig,
    ExtendedDaemonConfigSchema,
    getConfigurationHelp,
} from "./daemon/daemon-config-extended.js";
export type {
    ExtendedDaemonConfig,
} from "./daemon/daemon-config-extended.js";
export type {
    McpConfig,
    ServerConfig,
    ToolInfo,
    DiscoveryResult,
    ToolExecutionResult,
} from "./config/types.js";
export type {
    ServerStatus,
    ManagedServer,
} from "./gateway/server-registry.js";
export type {
    RecoveryHint,
} from "./errors/recovery-hints.js";
export type {
    AmbiguousToolInfo,
    ResolvedToolInfo,
} from "./gateway/tool-disambiguation.js";
export type {
    PartialDiscoveryResult,
    PartialExecutionResult,
} from "./gateway/graceful-failures.js";
export type {
    ErrorContext,
    FormattedError,
} from "./errors/error-context.js";
export type {
    HealthStatus,
    ServerHealthCheckResult,
    HealthCheckResult,
} from "./cli/commands/health.js";

// Phase 3A: TUI Application Exports
export {
    TUIApplication,
} from "./tui/app.js";
export {
    NavigationManager,
    NavigationStack,
} from "./tui/navigation/manager.js";
export {
    renderLogo,
    renderCompactLogo,
    renderLogoWithEffects,
    formatLogoScreen,
    createHeaderWithLogo,
    getLogoDimensions,
} from "./tui/components/logo.js";
export {
    renderDaemonStatusPanel,
    renderHealthPanel,
    renderFullStatusPanel,
    renderStatsBar,
    createStatusBadge,
} from "./tui/components/status-panel.js";
export {
    renderShortcutsPanel,
    renderShortcutsBar,
    renderHelpScreen,
    renderInlineHelp,
    renderContextMenu,
} from "./tui/components/shortcuts.js";
export {
    renderDashboard,
    renderCompactDashboard,
    createTextDashboard,
    renderWelcomeScreen,
    renderAlert,
} from "./tui/components/dashboard.js";
export {
    primaryTheme,
    spacing,
    boxStyles,
    keyboardShortcuts,
    logoArt,
    formatShortcut,
    createBox,
    centerText,
} from "./tui/styles/theme.js";
export type {
    DaemonTUIStatus,
    ToolTUIInfo,
    NavigationContext,
    KeyboardInput,
    TUIAppState,
    TUITheme,
    ComponentProps,
    DashboardMetrics,
} from "./tui/types.js";

// Week 5: Interactive Components
export {
    renderSelectableList,
    renderSearchableList,
    renderCompactList,
} from "./tui/components/selectable-list.js";
export type {
    ListItem,
} from "./tui/components/selectable-list.js";
export {
    renderButton,
    renderButtonPair,
    renderButtonGroup,
    createButton,
} from "./tui/components/button.js";
export type {
    ButtonVariant,
    ButtonState,
    ButtonConfig,
} from "./tui/components/button.js";
export {
    renderConfirmDialog,
    renderYesNoDialog,
    renderWarningDialog,
    renderErrorDialog,
    renderProgressDialog,
} from "./tui/components/confirm-dialog.js";
export type {
    ConfirmOptions,
} from "./tui/components/confirm-dialog.js";
export {
    renderToolListView,
    renderToolDetailsPane,
    renderToolCard,
} from "./tui/views/tool-list-view.js";
export {
    renderDaemonControlPanel,
    renderDaemonStartupWizard,
    renderDaemonLogsView,
} from "./tui/views/daemon-control.js";
export {
    renderSettingsEditorView,
    renderSettingsSaveConfirm,
    renderSettingsResetWarning,
    daemonSettingsFields,
} from "./tui/views/settings-editor.js";
export type {
    ExecutionParameters,
    ExecutionResult,
    WizardStep,
} from "./tui/views/execution-wizard.js";
export {
    renderWizardStepIndicator,
    renderWizardToolSelection,
    renderWizardParametersStep,
    renderWizardConfirmStep,
    renderWizardExecutingStep,
    renderWizardResultsStep,
} from "./tui/views/execution-wizard.js";

// Week 6: Advanced View Patterns - Layouts
export {
    renderHorizontalSplit,
    renderVerticalSplit,
    calculateSplitWidths,
    calculateSplitHeights,
} from "./tui/components/advanced/layouts.js";
export type {
    HorizontalSplitConfig,
    FocusedPane,
} from "./tui/components/advanced/layouts.js";

// Week 6: Advanced View Patterns - Tabs
export {
    renderTabBar,
    renderTabContainer,
    getTabNavigation,
    createTab,
    updateTabBadge,
    setTabEnabled,
    findAvailableTab,
} from "./tui/components/advanced/tabs.js";
export type {
    Tab,
    TabContent,
} from "./tui/components/advanced/tabs.js";

// Week 6: Advanced View Patterns - Collapsible
export {
    renderCollapsiblePanel,
    renderAccordion,
    togglePanel,
    getNextFocusedPanel,
    expandAllPanels,
    collapseAllPanels,
    createPanel,
} from "./tui/components/advanced/collapsible.js";
export type {
    CollapsibleConfig,
} from "./tui/components/advanced/collapsible.js";

// Week 6: Advanced View Patterns - Tree
export {
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
} from "./tui/components/advanced/tree.js";
export type {
    TreeNode,
} from "./tui/components/advanced/tree.js";

// Week 6: Advanced View Patterns - Updates & Change Tracking
export {
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
    COLOR_ADDED,
    COLOR_MODIFIED,
    COLOR_REMOVED,
    COLOR_RESET,
} from "./tui/components/advanced/updates.js";
export type {
    ChangeType,
    Change,
    AutoRefreshConfig,
    ChangeSummary,
} from "./tui/components/advanced/updates.js";

// Phase 3A Week 5: Interactive Components Exports
export {
    renderFormInput,
    renderFormFields,
    validateFormFields,
    getFormValues,
    updateFormField,
    validators,
} from "./tui/components/form-input.js";
export type {
    InputType,
    FormInputField,
    SimpleForm,
} from "./tui/components/form-input.js";
