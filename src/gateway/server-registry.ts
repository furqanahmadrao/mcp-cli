/**
 * Server Registry
 * Central management of MCP server lifecycle, connections, and health
 * 
 * Pattern 1: Server Registry (from Docker MCP Gateway)
 * Provides single source of truth for server state and management
 */

import type { ServerConfig } from '../config/types.js';
import { ConnectionError } from '../errors/custom-errors.js';
import { logInfo, logWarn, logError } from '../output/formatters.js';

/**
 * Server health status
 */
export interface ServerStatus {
    name: string;
    connected: boolean;
    responseTime?: number;
    toolCount: number;
    lastError?: string;
    lastCheck?: Date;
    cacheAge?: number; // milliseconds
}

/**
 * Server with metadata and state tracking
 */
export interface ManagedServer {
    name: string;
    config: ServerConfig;
    connected: boolean;
    lastError?: Error;
    lastCheck?: Date;
    toolCount: number;
    metadata: {
        connectionAttempts: number;
        successfulDiscoveries: number;
        failedDiscoveries: number;
        totalResponseTime: number; // for averaging
    };
}

/**
 * ServerRegistry
 * 
 * Central management of all MCP servers in the configuration.
 * Provides:
 * - Server lifecycle management (connect, disconnect, reconnect)
 * - Health status tracking per server
 * - Error recovery and retry logic
 * - Server metadata and statistics
 * 
 * @example
 * const registry = new ServerRegistry();
 * registry.register('database', dbConfig);
 * registry.register('filesystem', fsConfig);
 * const status = await registry.getStatus('database');
 */
export class ServerRegistry {
    private servers = new Map<string, ManagedServer>();
    private readonly maxRetries = 3;

    /**
     * Register a server in the registry
     */
    public register(name: string, config: ServerConfig): void {
        if (this.servers.has(name)) {
            logWarn(`Server "${name}" already registered, updating config`);
        }

        const server: ManagedServer = {
            name,
            config,
            connected: false,
            toolCount: 0,
            metadata: {
                connectionAttempts: 0,
                successfulDiscoveries: 0,
                failedDiscoveries: 0,
                totalResponseTime: 0,
            },
        };

        this.servers.set(name, server);
        logInfo(`Registered server: ${name}`);
    }

    /**
     * Get a registered server by name
     */
    public get(name: string): ManagedServer | undefined {
        return this.servers.get(name);
    }

    /**
     * Get all registered servers
     */
    public getAll(): ManagedServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * List all server names
     */
    public listNames(): string[] {
        return Array.from(this.servers.keys());
    }

    /**
     * Check if a server is registered
     */
    public has(name: string): boolean {
        return this.servers.has(name);
    }

    /**
     * Get count of registered servers
     */
    public count(): number {
        return this.servers.size;
    }

    /**
     * Mark a server as connected
     */
    public markConnected(name: string, toolCount: number = 0): void {
        const server = this.servers.get(name);
        if (!server) {
            throw new Error(`Server "${name}" not registered`);
        }

        server.connected = true;
        server.toolCount = toolCount;
        server.lastCheck = new Date();
        server.metadata.connectionAttempts++;
        server.metadata.successfulDiscoveries++;
        server.lastError = undefined;

        logInfo(`Server "${name}" connected (${toolCount} tools)`);
    }

    /**
     * Mark a server as disconnected with error
     */
    public markDisconnected(name: string, error: Error): void {
        const server = this.servers.get(name);
        if (!server) {
            throw new Error(`Server "${name}" not registered`);
        }

        server.connected = false;
        server.lastError = error;
        server.lastCheck = new Date();
        server.metadata.failedDiscoveries++;

        logError(`Server "${name}" disconnected: ${error.message}`);
    }

    /**
     * Record a connection attempt
     */
    public recordConnectionAttempt(name: string): void {
        const server = this.servers.get(name);
        if (server) {
            server.metadata.connectionAttempts++;
        }
    }

    /**
     * Record response time for metrics
     */
    public recordResponseTime(name: string, duration: number): void {
        const server = this.servers.get(name);
        if (server) {
            server.metadata.totalResponseTime += duration;
        }
    }

    /**
     * Get average response time for a server
     */
    public getAverageResponseTime(name: string): number {
        const server = this.servers.get(name);
        if (!server || server.metadata.successfulDiscoveries === 0) {
            return 0;
        }
        return server.metadata.totalResponseTime / server.metadata.successfulDiscoveries;
    }

    /**
     * Get health status of all servers
     */
    public getStatus(): ServerStatus[] {
        return this.getAll().map((server) => ({
            name: server.name,
            connected: server.connected,
            responseTime: this.getAverageResponseTime(server.name),
            toolCount: server.toolCount,
            lastError: server.lastError?.message,
            lastCheck: server.lastCheck,
        }));
    }

    /**
     * Get health status of a specific server
     */
    public getServerStatus(name: string): ServerStatus | undefined {
        const server = this.servers.get(name);
        if (!server) {
            return undefined;
        }

        return {
            name: server.name,
            connected: server.connected,
            responseTime: this.getAverageResponseTime(name),
            toolCount: server.toolCount,
            lastError: server.lastError?.message,
            lastCheck: server.lastCheck,
        };
    }

    /**
     * Get overall registry health summary
     */
    public getHealthSummary(): {
        totalServers: number;
        connectedServers: number;
        failedServers: number;
        totalTools: number;
    } {
        const all = this.getAll();
        const connected = all.filter((s) => s.connected).length;
        const failed = all.length - connected;
        const totalTools = all.reduce((sum, s) => sum + s.toolCount, 0);

        return {
            totalServers: all.length,
            connectedServers: connected,
            failedServers: failed,
            totalTools,
        };
    }

    /**
     * Reset metrics for all servers
     */
    public resetMetrics(): void {
        for (const server of this.servers.values()) {
            server.metadata = {
                connectionAttempts: 0,
                successfulDiscoveries: 0,
                failedDiscoveries: 0,
                totalResponseTime: 0,
            };
        }
    }

    /**
     * Clear all servers from registry
     */
    public clear(): void {
        this.servers.clear();
    }

    /**
     * Get summary statistics for debugging
     */
    public getSummary(): {
        totalServers: number;
        connectedServers: number;
        metrics: Record<string, {
            attempts: number;
            successes: number;
            failures: number;
            avgResponseTime: number;
        }>;
    } {
        const stats: Record<string, {
            attempts: number;
            successes: number;
            failures: number;
            avgResponseTime: number;
        }> = {};

        for (const server of this.servers.values()) {
            stats[server.name] = {
                attempts: server.metadata.connectionAttempts,
                successes: server.metadata.successfulDiscoveries,
                failures: server.metadata.failedDiscoveries,
                avgResponseTime: this.getAverageResponseTime(server.name),
            };
        }

        const summary = this.getHealthSummary();
        return {
            totalServers: summary.totalServers,
            connectedServers: summary.connectedServers,
            metrics: stats,
        };
    }
}

/**
 * Create a server registry and populate it from server configs
 */
export function createRegistryFromConfigs(
    configs: ServerConfig[]
): ServerRegistry {
    const registry = new ServerRegistry();

    for (const config of configs) {
        registry.register(config.name, config);
    }

    return registry;
}
