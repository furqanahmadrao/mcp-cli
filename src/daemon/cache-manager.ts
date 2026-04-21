/**
 * Cache Manager - Persistent Cache Layer
 * 
 * Manages caching of discovery results, health checks, and metrics with TTL support
 * Storage location: ~/.mcp/daemon/cache/
 */

import { promises as fs } from "fs";
import { join } from "path";
import type { DaemonConfig } from "./daemon-config.js";
import { getCacheDir, DEFAULT_DAEMON_CONFIG } from "./daemon-config.js";
import { log, logWarn } from "../output/formatters.js";

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
    totalEntries: number;
    cacheHits: number;
    cacheMisses: number;
    averageHitRate: number;
}

/**
 * CacheManager - Persistent cache with TTL support
 */
export class CacheManager {
    private config: DaemonConfig;
    private cacheDir: string;
    private stats: CacheStats = {
        totalEntries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageHitRate: 0,
    };

    // Default cache TTLs (in milliseconds)
    private defaultTTL = {
        tools: 5 * 60 * 1000, // 5 minutes
        health: 30 * 1000, // 30 seconds
        metrics: 60 * 1000, // 1 minute
    };

    constructor(config?: DaemonConfig) {
        this.config = config || DEFAULT_DAEMON_CONFIG;
        this.cacheDir = getCacheDir(this.config);
    }

    /**
     * Initialize cache directory
     */
    async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            log(`Cache directory ready: ${this.cacheDir}`);
        } catch (error) {
            logWarn(`Failed to initialize cache directory: ${error}`);
        }
    }

    /**
     * Get cache file path for a key
     */
    private getCacheFilePath(key: string): string {
        // Sanitize key for filename
        const sanitized = key.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        return join(this.cacheDir, `${sanitized}.json`);
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid<T>(entry: CacheEntry<T>): boolean {
        const now = Date.now();
        const age = now - entry.timestamp;
        return age < entry.ttl;
    }

    /**
     * Get cache entry by key
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const filePath = this.getCacheFilePath(key);
            const content = await fs.readFile(filePath, "utf-8");
            const entry = JSON.parse(content) as CacheEntry<T>;

            if (!this.isValid(entry)) {
                // Cache expired, delete it
                await this.delete(key);
                this.stats.cacheMisses++;
                return null;
            }

            this.stats.cacheHits++;
            return entry.data;
        } catch (error) {
            this.stats.cacheMisses++;
            return null;
        }
    }

    /**
     * Set cache entry with optional TTL override
     */
    async set<T>(key: string, data: T, ttlOverride?: number): Promise<void> {
        try {
            const filePath = this.getCacheFilePath(key);
            
            // Determine TTL based on key
            let ttl = ttlOverride;
            if (!ttl) {
                if (key.includes("tools")) ttl = this.defaultTTL.tools;
                else if (key.includes("health")) ttl = this.defaultTTL.health;
                else if (key.includes("metrics")) ttl = this.defaultTTL.metrics;
                else ttl = 5 * 60 * 1000; // Default to 5 minutes
            }

            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl,
            };

            await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
            this.stats.totalEntries++;
        } catch (error) {
            logWarn(`Failed to write cache entry ${key}: ${error}`);
        }
    }

    /**
     * Delete cache entry by key
     */
    async delete(key: string): Promise<void> {
        try {
            const filePath = this.getCacheFilePath(key);
            await fs.unlink(filePath);
        } catch {
            // File doesn't exist, that's fine
        }
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (file.endsWith(".json")) {
                    await fs.unlink(join(this.cacheDir, file));
                }
            }
            this.stats.totalEntries = 0;
            log("Cache cleared");
        } catch (error) {
            logWarn(`Failed to clear cache: ${error}`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.cacheHits + this.stats.cacheMisses;
        const hitRate = total > 0 ? this.stats.cacheHits / total : 0;
        return {
            ...this.stats,
            averageHitRate: hitRate,
        };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            totalEntries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageHitRate: 0,
        };
    }

    /**
     * Cleanup expired entries
     */
    async cleanup(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);
            let removedCount = 0;

            for (const file of files) {
                if (file.endsWith(".json")) {
                    const filePath = join(this.cacheDir, file);
                    const content = await fs.readFile(filePath, "utf-8");
                    const entry = JSON.parse(content) as CacheEntry<unknown>;

                    if (!this.isValid(entry)) {
                        await fs.unlink(filePath);
                        removedCount++;
                    }
                }
            }

            if (removedCount > 0) {
                log(`Cache cleanup: removed ${removedCount} expired entries`);
            }
        } catch (error) {
            logWarn(`Cache cleanup failed: ${error}`);
        }
    }

    /**
     * Set custom TTL for cache type
     */
    setTTL(type: "tools" | "health" | "metrics", ttlMs: number): void {
        this.defaultTTL[type] = ttlMs;
    }

    /**
     * Get current TTL for cache type
     */
    getTTL(type: "tools" | "health" | "metrics"): number {
        return this.defaultTTL[type];
    }
}

/**
 * Singleton instance for convenient use
 */
let cacheInstance: CacheManager | null = null;

/**
 * Get or create cache manager singleton
 */
export function getCacheManager(config?: DaemonConfig): CacheManager {
    if (!cacheInstance) {
        cacheInstance = new CacheManager(config);
    }
    return cacheInstance;
}

/**
 * Reset cache manager singleton (for testing)
 */
export function resetCacheManager(): void {
    cacheInstance = null;
}
