/**
 * Health Check Handler
 * 
 * Processes the health check command by examining all servers through
 * the GatewayCoordinator and ServerRegistry, returning detailed status
 * for each server.
 * 
 * @module cli/handlers/health
 */

import { GatewayCoordinator } from '../../gateway/coordinator.js';
import { ServerConfig } from '../../config/types.js';
import {
  HealthCheckResult,
  HealthStatus,
  ServerHealthCheckResult,
  determineHealthStatus,
  generateRecommendations,
  getOverallStatus,
} from '../commands/health.js';

export interface HealthHandlerOptions {
  verbose?: boolean;
  server?: string;
  output?: 'json' | 'table' | 'summary';
}

/**
 * Handle health check command
 * 
 * @param coordinator - GatewayCoordinator for server access
 * @param servers - All configured servers
 * @param options - Command options
 * @returns Health check result
 */
export async function handleHealthCheck(
  coordinator: GatewayCoordinator,
  servers: ServerConfig[],
  options: HealthHandlerOptions = {}
): Promise<HealthCheckResult> {
  // Initialize registry with all servers
  coordinator.initializeRegistry(servers);

  // Filter to specific server if requested
  const serversToCheck = options.server
    ? servers.filter(s => s.name === options.server)
    : servers;

  if (options.server && serversToCheck.length === 0) {
    throw new Error(`Server not found: ${options.server}`);
  }

  // Check health of each server
  const healthResults: ServerHealthCheckResult[] = [];
  
  for (const server of serversToCheck) {
    const serverHealth = await checkServerHealth(coordinator, server);
    healthResults.push(serverHealth);
  }

  // Calculate summary
  const summary = {
    total: healthResults.length,
    healthy: healthResults.filter(s => s.status === HealthStatus.HEALTHY).length,
    degraded: healthResults.filter(s => s.status === HealthStatus.DEGRADED).length,
    down: healthResults.filter(s => s.status === HealthStatus.DOWN).length,
    totalTools: healthResults.reduce((sum, s) => sum + s.toolsAvailable, 0),
    overallStatus: getOverallStatus(healthResults),
  };

  // Generate overall recommendations
  const recommendations = generateOverallRecommendations(healthResults, summary);

  return {
    success: summary.healthy === summary.total,
    timestamp: new Date(),
    servers: healthResults,
    summary,
    recommendations,
  };
}

/**
 * Check health of a single server
 */
async function checkServerHealth(
  coordinator: GatewayCoordinator,
  server: ServerConfig
): Promise<ServerHealthCheckResult> {
  const registry = coordinator.getRegistry();
  const lastCheck = new Date();
  
  let connected = false;
  let latency: number | undefined;
  let toolsAvailable = 0;
  let error: string | undefined;

  try {
    // Attempt to ping the server and get tools
    const startTime = Date.now();
    
    const tools = await coordinator.getServerTools(server);
    
    const endTime = Date.now();
    latency = endTime - startTime;

    if (tools && tools.length > 0) {
      connected = true;
      toolsAvailable = tools.length;
    } else {
      connected = true;
      toolsAvailable = 0;
    }
  } catch (err) {
    connected = false;
    error = err instanceof Error ? err.message : String(err);
    toolsAvailable = 0;
  }

  // Get timing info from registry
  const avgResponseTime = registry.getAverageResponseTime(server.name);

  // Determine status
  const status = determineHealthStatus(connected, latency, toolsAvailable);

  // Generate recommendations if not healthy
  const recommendations = status !== HealthStatus.HEALTHY
    ? generateRecommendations(status, latency, error)
    : undefined;

  return {
    serverName: server.name,
    status,
    connected,
    latency,
    toolsAvailable,
    error,
    lastCheck,
    timeSinceLastSuccess: undefined, // Would need historical data
    uptime: undefined, // Would need historical data
    recommendations,
  };
}

/**
 * Generate overall recommendations based on aggregate health
 */
function generateOverallRecommendations(
  results: ServerHealthCheckResult[],
  summary: HealthCheckResult['summary']
): string[] {
  const recommendations: string[] = [];

  if (summary.down > 0) {
    recommendations.push(
      `${summary.down} server(s) are down - immediate attention needed`
    );
    
    const downServers = results
      .filter(s => s.status === HealthStatus.DOWN)
      .map(s => s.serverName)
      .join(', ');
    recommendations.push(`Down servers: ${downServers}`);
  }

  if (summary.degraded > 0) {
    recommendations.push(
      `${summary.degraded} server(s) are degraded - monitor closely`
    );

    const degradedServers = results
      .filter(s => s.status === HealthStatus.DEGRADED)
      .map(s => ({
        name: s.serverName,
        latency: s.latency,
      }));

    for (const server of degradedServers) {
      if (server.latency && server.latency > 1000) {
        recommendations.push(
          `${server.name} has high latency (${server.latency}ms)`
        );
      }
    }
  }

  if (summary.totalTools === 0) {
    recommendations.push('No tools available - all servers may be down or misconfigured');
  }

  if (summary.healthy === summary.total && summary.total > 0) {
    recommendations.push('✓ All systems nominal - no action needed');
  }

  return recommendations;
}

/**
 * Format health check result as JSON
 */
export function formatHealthCheckAsJSON(result: HealthCheckResult): string {
  return JSON.stringify(
    {
      success: result.success,
      timestamp: result.timestamp.toISOString(),
      servers: result.servers.map(s => ({
        name: s.serverName,
        status: s.status,
        connected: s.connected,
        latency: s.latency,
        tools: s.toolsAvailable,
        error: s.error,
        recommendations: s.recommendations,
      })),
      summary: {
        total: result.summary.total,
        healthy: result.summary.healthy,
        degraded: result.summary.degraded,
        down: result.summary.down,
        totalTools: result.summary.totalTools,
        overallStatus: result.summary.overallStatus,
      },
      recommendations: result.recommendations,
    },
    null,
    2
  );
}

/**
 * Format health check result as a table
 */
export function formatHealthCheckAsTable(result: HealthCheckResult): string {
  const lines: string[] = [];

  lines.push(''); // blank line
  lines.push('SERVER HEALTH STATUS');
  lines.push('═'.repeat(70));

  // Header
  lines.push(
    `${'Server'.padEnd(20)} ${'Status'.padEnd(12)} ${'Latency'.padEnd(12)} ${'Tools'.padEnd(8)}`
  );
  lines.push('─'.repeat(70));

  // Rows
  for (const server of result.servers) {
    const icon = getStatusIcon(server.status);
    const latency = server.latency !== undefined ? `${server.latency}ms` : 'N/A';
    lines.push(
      `${icon} ${server.serverName.padEnd(18)} ${server.status.padEnd(12)} ${latency.padEnd(12)} ${String(server.toolsAvailable).padEnd(8)}`
    );

    if (server.error) {
      lines.push(`     Error: ${server.error.substring(0, 56)}`);
    }
  }

  lines.push('═'.repeat(70));
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`  Total Servers: ${result.summary.total}`);
  lines.push(`  Healthy: ${result.summary.healthy}`);
  lines.push(`  Degraded: ${result.summary.degraded}`);
  lines.push(`  Down: ${result.summary.down}`);
  lines.push(`  Total Tools: ${result.summary.totalTools}`);
  lines.push(`  Overall Status: ${result.summary.overallStatus.toUpperCase()}`);
  lines.push('');

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    for (const rec of result.recommendations) {
      lines.push(`  • ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get status icon
 */
function getStatusIcon(status: HealthStatus): string {
  switch (status) {
    case HealthStatus.HEALTHY:
      return '✅';
    case HealthStatus.DEGRADED:
      return '⚠️ ';
    case HealthStatus.DOWN:
      return '❌';
    default:
      return '  ';
  }
}
