/**
 * Extended Daemon Configuration Schema
 * 
 * Complete configuration schema with support for:
 * - Auto-start settings per platform
 * - Logging configuration
 * - Performance tuning
 * - Health check settings
 * - Cache TTL configuration
 */

import { z } from "zod";

/**
 * Extended daemon configuration schema
 */
export const ExtendedDaemonConfigSchema = z.object({
    // Basic settings
    enabled: z.boolean().default(true).describe("Enable daemon service"),
    autoStart: z.boolean().default(false).describe("Auto-start daemon on system boot"),

    // Logging
    logging: z
        .object({
            level: z
                .enum(["debug", "info", "warn", "error"])
                .default("info")
                .describe("Minimum log level"),
            maxFileSize: z
                .number()
                .default(50 * 1024 * 1024)
                .describe("Max log file size in bytes (50MB default)"),
            maxFiles: z
                .number()
                .default(10)
                .describe("Number of rotated log files to keep"),
            retentionDays: z
                .number()
                .default(7)
                .describe("Log file retention in days"),
            structured: z
                .boolean()
                .default(false)
                .describe("Use JSON structured logging"),
        })
        .optional(),

    // Health checking
    health: z
        .object({
            checkInterval: z
                .number()
                .default(30 * 1000)
                .describe("Health check interval in milliseconds"),
            checkTimeout: z
                .number()
                .default(5 * 1000)
                .describe("Health check timeout in milliseconds"),
            maxRetries: z.number().default(3).describe("Max retries before marking unhealthy"),
            retryBackoff: z.number().default(2).describe("Exponential backoff multiplier"),
        })
        .optional(),

    // Discovery/Caching
    discovery: z
        .object({
            cacheInterval: z
                .number()
                .default(5 * 60 * 1000)
                .describe("Tool discovery cache interval in milliseconds"),
            cacheTTL: z
                .number()
                .default(5 * 60 * 1000)
                .describe("Tool cache TTL in milliseconds"),
            healthCacheTTL: z
                .number()
                .default(30 * 1000)
                .describe("Health cache TTL in milliseconds"),
            metricsCacheTTL: z
                .number()
                .default(60 * 1000)
                .describe("Metrics cache TTL in milliseconds"),
        })
        .optional(),

    // Performance
    performance: z
        .object({
            maxConnections: z
                .number()
                .default(100)
                .describe("Max concurrent IPC connections"),
            connectionTimeout: z
                .number()
                .default(5 * 1000)
                .describe("Connection timeout in milliseconds"),
            requestTimeout: z
                .number()
                .default(30 * 1000)
                .describe("Request timeout in milliseconds"),
        })
        .optional(),

    // Platform-specific
    platform: z
        .object({
            windows: z
                .object({
                    taskName: z
                        .string()
                        .default("MCP\\Daemon")
                        .describe("Windows Task Scheduler task name"),
                    serviceName: z
                        .string()
                        .default("McpDaemon")
                        .describe("Windows service name"),
                    enableFirewall: z
                        .boolean()
                        .default(true)
                        .describe("Setup Windows Firewall exception"),
                })
                .optional(),
            macos: z
                .object({
                    launchAgentName: z
                        .string()
                        .default("com.mcp.daemon")
                        .describe("macOS LaunchAgent name"),
                    useLaunchd: z
                        .boolean()
                        .default(true)
                        .describe("Use launchd for auto-start"),
                })
                .optional(),
            linux: z
                .object({
                    serviceName: z
                        .string()
                        .default("mcp-daemon")
                        .describe("systemd service name"),
                    useSystemd: z
                        .boolean()
                        .default(true)
                        .describe("Use systemd user services"),
                })
                .optional(),
        })
        .optional(),

    // Advanced
    advanced: z
        .object({
            pidFile: z.string().optional().describe("Custom PID file location"),
            socketPath: z.string().optional().describe("Custom socket path"),
            cacheDir: z.string().optional().describe("Custom cache directory"),
            gracefulShutdownTimeout: z
                .number()
                .default(10 * 1000)
                .describe("Graceful shutdown timeout in milliseconds"),
            enableMetrics: z.boolean().default(true).describe("Enable performance metrics"),
            enableDiagnostics: z
                .boolean()
                .default(false)
                .describe("Enable diagnostic mode"),
        })
        .optional(),
});

export type ExtendedDaemonConfig = z.infer<typeof ExtendedDaemonConfigSchema>;

/**
 * Default extended daemon configuration
 */
export const DEFAULT_EXTENDED_DAEMON_CONFIG: ExtendedDaemonConfig = {
    enabled: true,
    autoStart: false,
    logging: {
        level: "info",
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 10,
        retentionDays: 7,
        structured: false,
    },
    health: {
        checkInterval: 30 * 1000,
        checkTimeout: 5 * 1000,
        maxRetries: 3,
        retryBackoff: 2,
    },
    discovery: {
        cacheInterval: 5 * 60 * 1000,
        cacheTTL: 5 * 60 * 1000,
        healthCacheTTL: 30 * 1000,
        metricsCacheTTL: 60 * 1000,
    },
    performance: {
        maxConnections: 100,
        connectionTimeout: 5 * 1000,
        requestTimeout: 30 * 1000,
    },
    platform: {
        windows: {
            taskName: "MCP\\Daemon",
            serviceName: "McpDaemon",
            enableFirewall: true,
        },
        macos: {
            launchAgentName: "com.mcp.daemon",
            useLaunchd: true,
        },
        linux: {
            serviceName: "mcp-daemon",
            useSystemd: true,
        },
    },
    advanced: {
        gracefulShutdownTimeout: 10 * 1000,
        enableMetrics: true,
        enableDiagnostics: false,
    },
};

/**
 * Validate and merge configuration with defaults
 */
export function createExtendedConfig(
    override?: Partial<ExtendedDaemonConfig>
): ExtendedDaemonConfig {
    try {
        return ExtendedDaemonConfigSchema.parse({
            ...DEFAULT_EXTENDED_DAEMON_CONFIG,
            ...override,
            logging: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.logging,
                ...override?.logging,
            },
            health: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.health,
                ...override?.health,
            },
            discovery: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.discovery,
                ...override?.discovery,
            },
            performance: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.performance,
                ...override?.performance,
            },
            platform: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.platform,
                ...override?.platform,
            },
            advanced: {
                ...DEFAULT_EXTENDED_DAEMON_CONFIG.advanced,
                ...override?.advanced,
            },
        });
    } catch (error) {
        throw new Error(`Invalid daemon config: ${error}`);
    }
}

/**
 * Get configuration description for help text
 */
export function getConfigurationHelp(): string {
    return `
Daemon Configuration Options:

BASIC:
  --daemon-enabled            Enable/disable daemon (true|false)
  --auto-start                Auto-start daemon on boot

LOGGING:
  --log-level                 Log level (debug|info|warn|error)
  --log-file-size            Max log file size in MB (default: 50)
  --log-files                 Number of rotated log files (default: 10)
  --log-retention             Log retention in days (default: 7)
  --structured-logging        Use JSON structured logging

HEALTH:
  --health-interval           Health check interval in seconds
  --health-timeout            Health check timeout in seconds
  --health-retries            Max health check retries

DISCOVERY:
  --cache-interval            Tool discovery cache interval in seconds
  --cache-ttl                 Tool cache TTL in seconds

PERFORMANCE:
  --max-connections           Max simultaneous connections
  --connection-timeout        Connection timeout in seconds
  --request-timeout           Request timeout in seconds
`;
}
