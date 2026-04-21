/**
 * Daemon Client - IPC Communication Layer
 * 
 * Communicates with the daemon process via Unix sockets (Linux/macOS) or named pipes (Windows)
 * Provides fallback mechanism when daemon is unavailable
 */

import { createConnection, Socket } from "net";
import type { DaemonConfig } from "./daemon-config.js";
import { getDaemonSocket, DEFAULT_DAEMON_CONFIG } from "./daemon-config.js";
import { log, logWarn } from "../output/formatters.js";

export interface DaemonRequest {
    type: "get_tools" | "get_health" | "get_metrics" | "ping";
    payload?: Record<string, unknown>;
}

export interface DaemonResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

export interface CachedTools {
    tools: Record<string, unknown>;
    servers: string[];
    timestamp: number;
    ttl: number;
}

export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: number;
    details: Record<string, unknown>;
}

export interface DaemonMetrics {
    uptime: number;
    memoryMB: number;
    cpuPercent: number;
    requestsHandled: number;
    cacheHits: number;
    cacheMisses: number;
    timestamp: number;
}

/**
 * DaemonClient - Connects to daemon process via IPC
 */
export class DaemonClient {
    private socket: Socket | null = null;
    private config: DaemonConfig;
    private timeout: number = 5000; // 5 second timeout
    private isConnected: boolean = false;

    constructor(config?: DaemonConfig) {
        this.config = config || DEFAULT_DAEMON_CONFIG;
    }

    /**
     * Connect to daemon via IPC socket
     */
    async connect(): Promise<boolean> {
        if (this.isConnected && this.socket) {
            return true;
        }

        return new Promise((resolve) => {
            const socketPath = getDaemonSocket(this.config);
            const timeoutHandle = setTimeout(() => {
                this.cleanup();
                resolve(false);
            }, this.timeout);

            try {
                this.socket = createConnection(socketPath, () => {
                    clearTimeout(timeoutHandle);
                    this.isConnected = true;
                    resolve(true);
                });

                this.socket.on("error", () => {
                    clearTimeout(timeoutHandle);
                    this.cleanup();
                    resolve(false);
                });
            } catch (error) {
                clearTimeout(timeoutHandle);
                this.cleanup();
                resolve(false);
            }
        });
    }

    /**
     * Send request to daemon and get response
     */
    private async sendRequest<T>(request: DaemonRequest): Promise<DaemonResponse<T> | null> {
        if (!this.isConnected || !this.socket) {
            return null;
        }

        return new Promise((resolve) => {
            const timeoutHandle = setTimeout(() => {
                this.cleanup();
                resolve(null);
            }, this.timeout);

            let responseData = "";

            const onData = (chunk: Buffer) => {
                responseData += chunk.toString();

                try {
                    const response = JSON.parse(responseData) as DaemonResponse<T>;
                    clearTimeout(timeoutHandle);
                    this.socket?.removeListener("data", onData);
                    resolve(response);
                } catch {
                    // Wait for more data
                }
            };

            const onError = () => {
                clearTimeout(timeoutHandle);
                this.socket?.removeListener("data", onData);
                this.cleanup();
                resolve(null);
            };

            this.socket.on("data", onData);
            this.socket.on("error", onError);

            try {
                const payload = JSON.stringify(request) + "\n";
                this.socket.write(payload);
            } catch {
                clearTimeout(timeoutHandle);
                this.cleanup();
                resolve(null);
            }
        });
    }

    /**
     * Get cached tools from daemon
     */
    async getCachedTools(): Promise<CachedTools | null> {
        const connected = await this.connect();
        if (!connected) {
            logWarn("Cannot connect to daemon for cached tools");
            return null;
        }

        const response = await this.sendRequest<CachedTools>({
            type: "get_tools",
        });

        if (!response?.success) {
            logWarn(`Daemon error: ${response?.error || "Unknown error"}`);
            return null;
        }

        return response.data || null;
    }

    /**
     * Get daemon health status
     */
    async getHealthStatus(): Promise<HealthStatus | null> {
        const connected = await this.connect();
        if (!connected) {
            return null;
        }

        const response = await this.sendRequest<HealthStatus>({
            type: "get_health",
        });

        return response?.success ? response.data || null : null;
    }

    /**
     * Get daemon metrics
     */
    async getMetrics(): Promise<DaemonMetrics | null> {
        const connected = await this.connect();
        if (!connected) {
            return null;
        }

        const response = await this.sendRequest<DaemonMetrics>({
            type: "get_metrics",
        });

        return response?.success ? response.data || null : null;
    }

    /**
     * Ping daemon to check if it's running
     */
    async ping(): Promise<boolean> {
        const connected = await this.connect();
        if (!connected) {
            return false;
        }

        const response = await this.sendRequest({
            type: "ping",
        });

        const isAlive = response?.success ?? false;
        if (!isAlive) {
            this.cleanup();
        }

        return isAlive;
    }

    /**
     * Close connection and cleanup
     */
    private cleanup(): void {
        if (this.socket) {
            try {
                this.socket.destroy();
            } catch {
                // Already closed
            }
            this.socket = null;
        }
        this.isConnected = false;
    }

    /**
     * Disconnect from daemon
     */
    disconnect(): void {
        this.cleanup();
    }
}

/**
 * Singleton instance for convenient use
 */
let clientInstance: DaemonClient | null = null;

/**
 * Get or create daemon client singleton
 */
export function getDaemonClient(config?: DaemonConfig): DaemonClient {
    if (!clientInstance) {
        clientInstance = new DaemonClient(config);
    }
    return clientInstance;
}

/**
 * Reset client singleton (for testing)
 */
export function resetDaemonClient(): void {
    if (clientInstance) {
        clientInstance.disconnect();
        clientInstance = null;
    }
}
