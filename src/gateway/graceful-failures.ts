/**
 * Graceful Failures System (Pattern 3)
 * 
 * Enables continued operation when some servers fail. Instead of stopping
 * on the first error, this system collects results from healthy servers,
 * falls back to cache for failed servers, and provides a comprehensive
 * summary of what succeeded and what failed.
 * 
 * @module gateway/graceful-failures
 */

import { ToolDefinition } from '@modelcontextprotocol/sdk/types.js';
import { GatewayCoordinator } from './coordinator.js';
import { ServerConfig } from '../config/types.js';

/**
 * Result of a partial discovery operation
 */
export interface PartialDiscoveryResult {
  /** Overall success of the operation */
  success: boolean;

  /** All tools discovered from healthy servers + cache */
  tools: ToolDefinition[];

  /** High-level message about the operation */
  message: string;

  /** Detailed information about failures */
  failures: Array<{
    /** Server that failed */
    server: string;
    /** Error that occurred */
    error: Error | string;
    /** Whether we used cached data as fallback */
    cached: boolean;
    /** Number of tools from cache */
    cachedToolCount?: number;
  }>;

  /** Summary statistics */
  summary: {
    /** Total servers attempted */
    attempts: number;
    /** Servers that succeeded */
    succeeded: number;
    /** Servers that failed */
    failed: number;
    /** Servers where we used cache fallback */
    usedCache: number;
    /** Total tools discovered */
    totalTools: number;
    /** Overall success percentage */
    successPercentage: number;
  };

  /** Warnings for user attention */
  warnings: string[];
}

/**
 * Result of a partial execution operation
 */
export interface PartialExecutionResult {
  /** Whether execution succeeded */
  success: boolean;

  /** The execution result (or null if failed) */
  result?: unknown;

  /** Error if execution failed */
  error?: Error | string;

  /** Which server executed the tool */
  server?: string;

  /** Whether this was from cache */
  fromCache: boolean;

  /** Message about the execution */
  message: string;
}

/**
 * Cache store for tool discovery results
 * Maps server names to cached tool lists
 */
interface DiscoveryCache {
  [serverName: string]: {
    tools: ToolDefinition[];
    timestamp: number;
    ttl: number;
  };
}

/**
 * Global cache for discovery results
 * TTL is configurable per cache entry
 */
const discoveryCache: DiscoveryCache = {};

/**
 * Discover tools gracefully, handling partial failures
 * 
 * Operation:
 * 1. Attempt discovery from all servers in parallel
 * 2. Collect results from healthy servers
 * 3. For failed servers, try to use cached tools
 * 4. Return aggregate results + failure details
 * 
 * @param coordinator - GatewayCoordinator to use for discovery
 * @param servers - Server configurations to discover from
 * @param cacheTTL - Cache time-to-live in milliseconds (default: 300000 = 5 min)
 * @returns Partial discovery result with successes, failures, and summary
 * 
 * @example
 * ```typescript
 * const result = await discoverToolsGracefully(coordinator, servers);
 * console.log(`Found ${result.summary.totalTools} tools`);
 * console.log(`${result.summary.succeeded} servers healthy`);
 * if (result.failures.length > 0) {
 *   console.log(`${result.failures.length} servers failed`);
 * }
 * ```
 */
export async function discoverToolsGracefully(
  coordinator: GatewayCoordinator,
  servers: ServerConfig[],
  cacheTTL: number = 300000 // 5 minutes
): Promise<PartialDiscoveryResult> {
  const failures: PartialDiscoveryResult['failures'] = [];
  const tools: ToolDefinition[] = [];
  const warnings: string[] = [];
  let succeeded = 0;
  let usedCache = 0;

  // Attempt discovery from all servers
  const discoveryPromises = servers.map(async server => {
    try {
      // Attempt to discover from this server (correctly passing single server config)
      const serverTools = await coordinator.getServerTools(server);
      
      if (serverTools && serverTools.length > 0) {
        // Success: add these tools
        tools.push(...serverTools);
        succeeded++;
        
        // Cache the result
        updateCache(server.name, serverTools, cacheTTL);
        
        return { success: true };
      } else {
        // Empty result
        throw new Error('No tools discovered from server');
      }
    } catch (error) {
      // Discovery failed for this server
      // Try to use cached tools
      const cached = getCachedTools(server.name);
      
      if (cached && cached.tools.length > 0) {
        // Use cache as fallback
        tools.push(...cached.tools);
        usedCache++;
        failures.push({
          server: server.name,
          error: error instanceof Error ? error : String(error),
          cached: true,
          cachedToolCount: cached.tools.length,
        });
        warnings.push(
          `Server "${server.name}" failed - using ${cached.tools.length} cached tools`
        );
        return { success: false, cached: true };
      } else {
        // No cache available
        failures.push({
          server: server.name,
          error: error instanceof Error ? error : String(error),
          cached: false,
          cachedToolCount: 0,
        });
        warnings.push(
          `Server "${server.name}" failed - no cache available`
        );
        return { success: false, cached: false };
      }
    }
  });

  // Wait for all discovery attempts
  await Promise.all(discoveryPromises);

  const totalAttempts = servers.length;
  const failed = totalAttempts - succeeded;
  const totalTools = tools.length;
  const successPercentage = totalAttempts > 0 ? (succeeded / totalAttempts) * 100 : 0;

  const allSucceeded = failures.length === 0;

  return {
    success: allSucceeded && totalTools > 0,
    tools,
    message: allSucceeded
      ? `Successfully discovered ${totalTools} tools from all servers`
      : `Discovered ${totalTools} tools with ${failures.length} server failures`,
    failures,
    summary: {
      attempts: totalAttempts,
      succeeded,
      failed,
      usedCache,
      totalTools,
      successPercentage,
    },
    warnings,
  };
}

/**
 * Execute a tool gracefully, handling failures with fallbacks
 * 
 * Operation:
 * 1. Attempt execution on primary server
 * 2. On failure, try alternative servers
 * 3. Record all attempts
 * 4. Return best result available
 * 
 * @param coordinator - GatewayCoordinator to use for execution
 * @param server - Primary server to execute on
 * @param toolName - Tool to execute
 * @param input - Tool input parameters
 * @param altServers - Alternative servers to try if primary fails
 * @returns Partial execution result
 * 
 * @example
 * ```typescript
 * const result = await executeToolGracefully(
 *   coordinator,
 *   primaryServer,
 *   'my_tool',
 *   { key: 'value' },
 *   [altServer1, altServer2]
 * );
 * if (result.success) {
 *   console.log('Executed on:', result.server);
 * } else {
 *   console.log('Execution failed:', result.error);
 * }
 * ```
 */
export async function executeToolGracefully(
  coordinator: GatewayCoordinator,
  server: ServerConfig,
  toolName: string,
  input: unknown,
  altServers: ServerConfig[] = []
): Promise<PartialExecutionResult> {
  const serversToTry = [server, ...altServers];
  
  // Try each server in sequence
  for (const tryServer of serversToTry) {
    try {
      const result = await coordinator.executeTool(tryServer, toolName, input);
      
      return {
        success: true,
        result,
        server: tryServer.name,
        fromCache: false,
        message: `Tool executed successfully on ${tryServer.name}`,
      };
    } catch (error) {
      // This server failed, try next
      if (tryServer === serversToTry[serversToTry.length - 1]) {
        // Last server tried, all failed
        return {
          success: false,
          error: error instanceof Error ? error : String(error),
          server: server.name,
          fromCache: false,
          message: `Tool execution failed on all ${serversToTry.length} server(s)`,
        };
      }
      // Continue to next server
    }
  }

  return {
    success: false,
    error: new Error('No servers available for execution'),
    fromCache: false,
    message: 'Tool execution failed - no servers available',
  };
}

/**
 * Update the cache with discovery results
 */
function updateCache(
  serverName: string,
  tools: ToolDefinition[],
  ttl: number
): void {
  discoveryCache[serverName] = {
    tools,
    timestamp: Date.now(),
    ttl,
  };
}

/**
 * Get cached tools for a server, if still valid
 */
function getCachedTools(
  serverName: string
): { tools: ToolDefinition[]; timestamp: number } | null {
  const cached = discoveryCache[serverName];
  
  if (!cached) {
    return null; // No cache
  }

  const age = Date.now() - cached.timestamp;
  if (age > cached.ttl) {
    // Cache expired
    delete discoveryCache[serverName];
    return null;
  }

  // Cache is still valid
  return cached;
}

/**
 * Clear all cached discovery results
 */
export function clearDiscoveryCache(): void {
  Object.keys(discoveryCache).forEach(key => delete discoveryCache[key]);
}

/**
 * Get cache statistics for diagnostics
 */
export function getCacheStats(): {
  servers: number;
  entries: Array<{
    serverName: string;
    toolCount: number;
    age: number;
    ttl: number;
    expired: boolean;
  }>;
} {
  const entries = Object.entries(discoveryCache).map(([serverName, cached]) => {
    const age = Date.now() - cached.timestamp;
    const expired = age > cached.ttl;
    
    return {
      serverName,
      toolCount: cached.tools.length,
      age,
      ttl: cached.ttl,
      expired,
    };
  });

  return {
    servers: entries.length,
    entries,
  };
}

/**
 * Decorator to wrap a discovery function with graceful failure handling
 * 
 * @example
 * ```typescript
 * export const discoverWithGracefulHandling = withGracefulFailures(
 *   async (coordinator, servers) => {
 *     return coordinator.getServerTools(servers);
 *   }
 * );
 * ```
 */
export function withGracefulFailures<T>(
  fn: (coordinator: GatewayCoordinator, servers: ServerConfig[]) => Promise<T>
): (coordinator: GatewayCoordinator, servers: ServerConfig[]) => Promise<{
  result: T | null;
  error: Error | null;
}> {
  return async (coordinator: GatewayCoordinator, servers: ServerConfig[]) => {
    try {
      const result = await fn(coordinator, servers);
      return { result, error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };
}
