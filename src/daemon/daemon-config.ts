/**
 * Daemon Configuration
 * 
 * Configuration schema and defaults for the MCP CLI daemon service.
 * Handles configuration validation and default settings.
 */

import { z } from 'zod';
import os from 'os';
import path from 'path';

/**
 * Configuration schema for daemon mode
 */
export const DaemonConfigSchema = z.object({
  daemon: z.object({
    enabled: z.boolean().default(false).describe('Enable daemon mode'),
    autoStart: z.boolean().default(false).describe('Start daemon on system boot'),
    healthCheckInterval: z.number().default(30000).describe('Health check interval in ms (default 30s)'),
    discoveryRefreshInterval: z.number().default(300000).describe('Tool discovery refresh in ms (default 5m)'),
    port: z.number().default(5555).describe('Daemon port'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info').describe('Log level'),
    maxLogSizeMB: z.number().default(50).describe('Max log file size'),
    logRetentionDays: z.number().default(7).describe('Log retention days'),
  }).optional(),
});

export type DaemonConfig = z.infer<typeof DaemonConfigSchema>;

/**
 * Default daemon configuration
 */
export const DEFAULT_DAEMON_CONFIG: DaemonConfig = {
  daemon: {
    enabled: false,
    autoStart: false,
    healthCheckInterval: 30000,
    discoveryRefreshInterval: 300000,
    port: 5555,
    logLevel: 'info',
    maxLogSizeMB: 50,
    logRetentionDays: 7,
  },
};

/**
 * Get daemon directory path
 */
export function getDaemonDir(): string {
  return path.join(os.homedir(), '.mcp', 'daemon');
}

/**
 * Get daemon PID file path
 */
export function getDaemonPidFile(): string {
  return path.join(getDaemonDir(), 'daemon.pid');
}

/**
 * Get daemon log file path
 */
export function getDaemonLogFile(): string {
  return path.join(getDaemonDir(), 'daemon.log');
}

/**
 * Get daemon socket path (Unix socket on Linux/macOS, named pipe on Windows)
 */
export function getDaemonSocket(): string {
  if (os.platform() === 'win32') {
    // Windows uses named pipes
    return '\\\\.\\pipe\\mcp-daemon';
  } else {
    // Unix sockets on Linux/macOS
    return path.join(getDaemonDir(), 'daemon.sock');
  }
}

/**
 * Get cache directory
 */
export function getCacheDir(): string {
  return path.join(getDaemonDir(), 'cache');
}

/**
 * Validate daemon configuration
 */
export function validateDaemonConfig(config: unknown): DaemonConfig {
  try {
    return DaemonConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid daemon configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if daemon is currently enabled
 */
export function isDaemonEnabled(config?: DaemonConfig): boolean {
  return config?.daemon?.enabled ?? DEFAULT_DAEMON_CONFIG.daemon?.enabled ?? false;
}

/**
 * Check if daemon auto-start is enabled
 */
export function isDaemonAutoStart(config?: DaemonConfig): boolean {
  return config?.daemon?.autoStart ?? DEFAULT_DAEMON_CONFIG.daemon?.autoStart ?? false;
}
