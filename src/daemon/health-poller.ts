/**
 * Health Poller - Background Polling Service
 * 
 * Periodically polls daemon for health status and caches results
 * Handles graceful degradation when daemon is unavailable
 */

import { EventEmitter } from "events";
import { DaemonClient, HealthStatus } from "./daemon-client.js";
import { CacheManager } from "./cache-manager.js";
import type { DaemonConfig } from "./daemon-config.js";
import { DEFAULT_DAEMON_CONFIG } from "./daemon-config.js";
import { log, logWarn } from "../output/formatters.js";

export interface PollerConfig {
    healthCheckInterval: number; // ms between health checks
    discoveryInterval: number; // ms between discovery refreshes
    maxRetries: number; // Max retries before marking unhealthy
    retryBackoff: number; // Exponential backoff multiplier
}

export interface PollerStatus {
    isRunning: boolean;
    lastHealthCheck: number | null;
    lastDiscoveryRefresh: number | null;
    healthCheckErrors: number;
    discoveryRefreshErrors: number;
    isHealthy: boolean;
}

export type PollerEvent = "health_check" | "discovery_refresh" | "status_change" | "error";

/**
 * HealthPoller - Background polling service
 */
export class HealthPoller extends EventEmitter {
    private client: DaemonClient;
    private cache: CacheManager;
    private config: PollerConfig;
    private daemonConfig: DaemonConfig;
    private status: PollerStatus = {
        isRunning: false,
        lastHealthCheck: null,
        lastDiscoveryRefresh: null,
        healthCheckErrors: 0,
        discoveryRefreshErrors: 0,
        isHealthy: false,
    };
    private healthCheckTimer: NodeJS.Timeout | null = null;
    private discoveryTimer: NodeJS.Timeout | null = null;
    private lastHealthStatus: HealthStatus | null = null;

    constructor(
        daemonConfig?: DaemonConfig,
        pollerConfig?: Partial<PollerConfig>,
        cache?: CacheManager
    ) {
        super();
        this.daemonConfig = daemonConfig || DEFAULT_DAEMON_CONFIG;
        this.client = new DaemonClient(this.daemonConfig);
        this.cache = cache || new CacheManager(this.daemonConfig);

        // Set default poller config
        this.config = {
            healthCheckInterval: 30 * 1000, // 30 seconds
            discoveryInterval: 5 * 60 * 1000, // 5 minutes
            maxRetries: 3,
            retryBackoff: 2,
            ...pollerConfig,
        };
    }

    /**
     * Start polling
     */
    async start(): Promise<void> {
        if (this.status.isRunning) {
            logWarn("Health poller already running");
            return;
        }

        this.status.isRunning = true;
        this.status.healthCheckErrors = 0;
        this.status.discoveryRefreshErrors = 0;

        log("Health poller started");
        this.emit("status_change", { isRunning: true });

        // Initial health check
        await this.performHealthCheck();

        // Schedule recurring health checks
        this.healthCheckTimer = setInterval(
            () => this.performHealthCheck().catch((err) => {
                logWarn(`Health check error: ${err}`);
                this.emit("error", { type: "health_check", error: err });
            }),
            this.config.healthCheckInterval
        );

        // Schedule recurring discovery refreshes
        this.discoveryTimer = setInterval(
            () => this.performDiscoveryRefresh().catch((err) => {
                logWarn(`Discovery refresh error: ${err}`);
                this.emit("error", { type: "discovery_refresh", error: err });
            }),
            this.config.discoveryInterval
        );
    }

    /**
     * Stop polling
     */
    stop(): void {
        if (!this.status.isRunning) {
            return;
        }

        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }

        if (this.discoveryTimer) {
            clearInterval(this.discoveryTimer);
            this.discoveryTimer = null;
        }

        this.status.isRunning = false;
        log("Health poller stopped");
        this.emit("status_change", { isRunning: false });
    }

    /**
     * Perform single health check
     */
    private async performHealthCheck(): Promise<void> {
        try {
            const health = await this.client.getHealthStatus();

            if (health) {
                this.lastHealthStatus = health;
                this.status.lastHealthCheck = Date.now();
                this.status.healthCheckErrors = 0;
                this.status.isHealthy = health.status === "healthy";

                // Cache health result
                await this.cache.set("daemon_health", health, this.config.healthCheckInterval);

                this.emit("health_check", { health, isHealthy: this.status.isHealthy });
            } else {
                this.status.healthCheckErrors++;
                this.status.isHealthy = false;

                if (this.status.healthCheckErrors >= this.config.maxRetries) {
                    this.emit("health_check", {
                        health: null,
                        isHealthy: false,
                        error: "Daemon unresponsive",
                    });
                }
            }
        } catch (error) {
            this.status.healthCheckErrors++;
            this.status.isHealthy = false;
            this.emit("error", { type: "health_check", error });
        }
    }

    /**
     * Perform discovery refresh and cache results
     */
    private async performDiscoveryRefresh(): Promise<void> {
        try {
            const tools = await this.client.getCachedTools();

            if (tools) {
                this.status.lastDiscoveryRefresh = Date.now();
                this.status.discoveryRefreshErrors = 0;

                // Cache tools result
                await this.cache.set("daemon_tools", tools, this.config.discoveryInterval);

                this.emit("discovery_refresh", { tools, success: true });
            } else {
                this.status.discoveryRefreshErrors++;

                if (this.status.discoveryRefreshErrors >= this.config.maxRetries) {
                    this.emit("discovery_refresh", {
                        tools: null,
                        success: false,
                        error: "Failed to refresh discovery",
                    });
                }
            }
        } catch (error) {
            this.status.discoveryRefreshErrors++;
            this.emit("error", { type: "discovery_refresh", error });
        }
    }

    /**
     * Get current poller status
     */
    getStatus(): PollerStatus {
        return { ...this.status };
    }

    /**
     * Get last cached health status
     */
    getLastHealthStatus(): HealthStatus | null {
        return this.lastHealthStatus;
    }

    /**
     * Force immediate health check
     */
    async forceHealthCheck(): Promise<HealthStatus | null> {
        await this.performHealthCheck();
        return this.lastHealthStatus;
    }

    /**
     * Get polled daemon status for display
     */
    async getPolledStats(): Promise<{
        isDaemonRunning: boolean;
        lastHealthCheck: Date | null;
        lastDiscoveryRefresh: Date | null;
        errorCount: number;
    }> {
        return {
            isDaemonRunning: this.status.isHealthy,
            lastHealthCheck: this.status.lastHealthCheck ? new Date(this.status.lastHealthCheck) : null,
            lastDiscoveryRefresh: this.status.lastDiscoveryRefresh ? new Date(this.status.lastDiscoveryRefresh) : null,
            errorCount: this.status.healthCheckErrors + this.status.discoveryRefreshErrors,
        };
    }

    /**
     * Reset error counters
     */
    resetErrorCounters(): void {
        this.status.healthCheckErrors = 0;
        this.status.discoveryRefreshErrors = 0;
    }

    /**
     * Update polling intervals
     */
    updateIntervals(config: Partial<PollerConfig>): void {
        Object.assign(this.config, config);

        // Restart polling with new intervals if currently running
        if (this.status.isRunning) {
            this.stop();
            this.start().catch((err) => {
                logWarn(`Failed to restart poller with new intervals: ${err}`);
            });
        }
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.stop();
        this.client.disconnect();
        this.removeAllListeners();
    }
}

/**
 * Singleton instance for convenient use
 */
let pollerInstance: HealthPoller | null = null;

/**
 * Get or create health poller singleton
 */
export function getHealthPoller(
    daemonConfig?: DaemonConfig,
    pollerConfig?: Partial<PollerConfig>,
    cache?: CacheManager
): HealthPoller {
    if (!pollerInstance) {
        pollerInstance = new HealthPoller(daemonConfig, pollerConfig, cache);
    }
    return pollerInstance;
}

/**
 * Reset health poller singleton (for testing)
 */
export function resetHealthPoller(): void {
    if (pollerInstance) {
        pollerInstance.cleanup();
        pollerInstance = null;
    }
}
