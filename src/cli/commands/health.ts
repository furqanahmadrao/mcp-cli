/**
 * Health Check Command
 * 
 * New CLI command to check the health status of all configured servers.
 * Shows connection status, latency, tool availability, and provides
 * recommendations for unhealthy servers.
 * 
 * @module cli/commands/health
 */

import { Command } from 'commander';
import { loadConfigWithProfile } from '../../config/loader.js';
import { GatewayCoordinator } from '../../gateway/coordinator.js';
import { handleHealthCheck, formatHealthCheckAsJSON, formatHealthCheckAsTable } from '../handlers/health.js';
import { outputJSON, log } from '../../output/formatters.js';
import { formatError } from '../../errors/error-formatter.js';
import { ConfigError } from '../../errors/custom-errors.js';

/**
 * Create the health check command
 */
export function createHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Check the health status of all configured servers')
    .option('-v, --verbose', 'Show detailed health information')
    .option('-s, --server <name>', 'Check a specific server only')
    .option('-o, --output <format>', 'Output format: json, table, or summary (default: summary)')
    .option('-p, --profile <name>', 'Use a specific profile')
    .action(async (options) => {
      try {
        log('Loading configuration...');
        const { config, selectedServers } = loadConfigWithProfile(options.profile);

        const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
        
        log('Checking server health...');
        const result = await handleHealthCheck(coordinator, config.servers, {
          verbose: options.verbose,
          server: options.server,
          output: options.output as any
        });

        if (options.output === 'json') {
          console.log(formatHealthCheckAsJSON(result));
        } else if (options.output === 'table') {
          console.log(formatHealthCheckAsTable(result));
        } else {
          // Default summary format
          console.log(formatHealthCheckAsTable(result)); // Summary is often same as table but less detailed
        }

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof ConfigError) {
          outputJSON(formatError(error));
        } else {
          outputJSON(formatError(error));
        }
        process.exit(1);
      }
    });
}

/**
 * Health status enum
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
  UNKNOWN = 'unknown',
}

/**
 * Individual server health check result
 */
export interface ServerHealthCheckResult {
  /** Server name */
  serverName: string;

  /** Current health status */
  status: HealthStatus;

  /** Whether server is connected */
  connected: boolean;

  /** Latency to server in milliseconds */
  latency?: number;

  /** Number of tools available */
  toolsAvailable: number;

  /** Any error message if unhealthy */
  error?: string;

  /** Timestamp of last check */
  lastCheck: Date;

  /** Time since last successful check */
  timeSinceLastSuccess?: number;

  /** Uptime percentage (0-100) */
  uptime?: number;

  /** Recommendations if unhealthy */
  recommendations?: string[];
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  /** Overall success of health check */
  success: boolean;

  /** Timestamp of check */
  timestamp: Date;

  /** Individual server results */
  servers: ServerHealthCheckResult[];

  /** Aggregate summary */
  summary: {
    /** Total servers checked */
    total: number;
    /** Healthy servers */
    healthy: number;
    /** Degraded servers */
    degraded: number;
    /** Down servers */
    down: number;
    /** Total tools available */
    totalTools: number;
    /** Overall service health status */
    overallStatus: HealthStatus;
  };

  /** General recommendations */
  recommendations: string[];
}

/**
 * Determine health status based on criteria
 */
export function determineHealthStatus(
  connected: boolean,
  latency?: number,
  toolsAvailable?: number
): HealthStatus {
  if (!connected) {
    return HealthStatus.DOWN;
  }

  if (!latency && !toolsAvailable) {
    return HealthStatus.UNKNOWN;
  }

  // Degraded if latency is high
  if (latency !== undefined && latency > 1000) {
    return HealthStatus.DEGRADED;
  }

  // Degraded if no tools available
  if (toolsAvailable === 0) {
    return HealthStatus.DEGRADED;
  }

  return HealthStatus.HEALTHY;
}

/**
 * Generate recommendations based on health status
 */
export function generateRecommendations(
  status: HealthStatus,
  latency?: number,
  error?: string
): string[] {
  const recommendations: string[] = [];

  if (status === HealthStatus.DOWN) {
    recommendations.push('Server is not responding');
    recommendations.push('Check if the server process is running');
    recommendations.push('Verify the server address and port configuration');
    if (error?.includes('ECONNREFUSED')) {
      recommendations.push('Connection was refused - server may not be listening');
    } else if (error?.includes('ENOTFOUND') || error?.includes('EHOSTUNREACH')) {
      recommendations.push('Cannot reach the server - check network connectivity');
    } else if (error?.includes('ETIMEDOUT')) {
      recommendations.push('Server is not responding in time - may be overloaded');
    }
  } else if (status === HealthStatus.DEGRADED) {
    if (latency !== undefined && latency > 1000) {
      recommendations.push(`High latency detected (${latency}ms)`);
      recommendations.push('Server may be under heavy load');
      recommendations.push('Consider checking server resources (CPU, memory, network)');
      recommendations.push('Check if there are long-running processes on the server');
    }
  }

  return recommendations;
}

/**
 * Format health check results for display
 */
export function formatHealthCheckResult(
  result: HealthCheckResult,
  detailed: boolean = false
): string {
  const lines: string[] = [];

  // Title
  lines.push('SERVER HEALTH CHECK');
  lines.push(`Timestamp: ${result.timestamp.toISOString()}`);
  lines.push('');

  // Server status table
  lines.push('SERVER STATUS:');
  
  for (const server of result.servers) {
    const statusIcon = getStatusIcon(server.status);
    const latencyStr = server.latency !== undefined ? `${server.latency}ms` : 'N/A';
    
    lines.push(
      `${statusIcon} ${server.serverName.padEnd(20)} | ` +
      `Status: ${server.status.padEnd(10)} | ` +
      `Latency: ${latencyStr.padEnd(8)} | ` +
      `Tools: ${server.toolsAvailable}`
    );

    if (detailed && server.error) {
      lines.push(`   Error: ${server.error}`);
    }

    if (detailed && server.recommendations) {
      for (const rec of server.recommendations) {
        lines.push(`   → ${rec}`);
      }
    }
  }

  lines.push('');
  lines.push('SUMMARY:');
  lines.push(`  Total Servers: ${result.summary.total}`);
  lines.push(`  Healthy: ${result.summary.healthy}`);
  lines.push(`  Degraded: ${result.summary.degraded}`);
  lines.push(`  Down: ${result.summary.down}`);
  lines.push(`  Total Tools: ${result.summary.totalTools}`);
  lines.push(`  Overall Status: ${result.summary.overallStatus.toUpperCase()}`);

  if (result.recommendations.length > 0) {
    lines.push('');
    lines.push('RECOMMENDATIONS:');
    for (const rec of result.recommendations) {
      lines.push(`  • ${rec}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get icon/emoji for status
 */
function getStatusIcon(status: HealthStatus): string {
  switch (status) {
    case HealthStatus.HEALTHY:
      return '✅';
    case HealthStatus.DEGRADED:
      return '⚠️ ';
    case HealthStatus.DOWN:
      return '❌';
    case HealthStatus.UNKNOWN:
      return '❓';
    default:
      return '  ';
  }
}

/**
 * Get overall status from individual server statuses
 */
export function getOverallStatus(servers: ServerHealthCheckResult[]): HealthStatus {
  if (servers.length === 0) {
    return HealthStatus.UNKNOWN;
  }

  const statuses = servers.map(s => s.status);
  
  if (statuses.includes(HealthStatus.DOWN) && !statuses.includes(HealthStatus.HEALTHY)) {
    return HealthStatus.DOWN;
  }

  if (statuses.includes(HealthStatus.DEGRADED)) {
    return HealthStatus.DEGRADED;
  }

  if (statuses.every(s => s === HealthStatus.HEALTHY)) {
    return HealthStatus.HEALTHY;
  }

  return HealthStatus.UNKNOWN;
}
