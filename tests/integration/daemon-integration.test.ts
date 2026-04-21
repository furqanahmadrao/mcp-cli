/**
 * Integration tests for daemon + cache + health poller workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DaemonClient, getDaemonClient, resetDaemonClient } from "../src/daemon/daemon-client.js";
import { CacheManager, getCacheManager, resetCacheManager } from "../src/daemon/cache-manager.js";
import { HealthPoller, getHealthPoller, resetHealthPoller } from "../src/daemon/health-poller.js";
import { DaemonConfig } from "../src/daemon/daemon-config.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Daemon Integration Tests", () => {
    let tempDir: string;
    let daemonConfig: DaemonConfig;
    let cache: CacheManager;

    beforeEach(async () => {
        // Create temporary directory for cache
        tempDir = path.join(os.tmpdir(), `mcp-test-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Create daemon config pointing to temp directory
        daemonConfig = new DaemonConfig();
        Object.defineProperty(daemonConfig, "daemonDir", {
            value: tempDir,
            writable: true,
        });

        cache = new CacheManager(daemonConfig);
        await cache.initialize();

        // Reset singletons
        resetDaemonClient();
        resetCacheManager();
        resetHealthPoller();
    });

    afterEach(() => {
        // Cleanup
        resetDaemonClient();
        resetCacheManager();
        resetHealthPoller();

        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    });

    describe("Cache Manager", () => {
        it("should initialize cache directory", async () => {
            expect(fs.existsSync(tempDir)).toBe(true);
        });

        it("should cache and retrieve data", async () => {
            const testData = { servers: ["test"], tools: { test: [] } };
            await cache.set("test_key", testData);

            const retrieved = await cache.get("test_key");
            expect(retrieved).toEqual(testData);
        });

        it("should respect TTL expiration", async () => {
            const testData = { test: "data" };
            await cache.set("ttl_key", testData, 100); // 100ms TTL

            // Immediate read should work
            let retrieved = await cache.get("ttl_key");
            expect(retrieved).toEqual(testData);

            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Should be expired
            retrieved = await cache.get("ttl_key");
            expect(retrieved).toBeNull();
        });

        it("should track cache statistics", () => {
            const stats = cache.getStats();
            expect(stats.cacheHits).toBe(0);
            expect(stats.cacheMisses).toBe(0);
        });

        it("should clear all cache entries", async () => {
            await cache.set("key1", { data: 1 });
            await cache.set("key2", { data: 2 });
            await cache.set("key3", { data: 3 });

            await cache.clear();

            const key1 = await cache.get("key1");
            const key2 = await cache.get("key2");
            const key3 = await cache.get("key3");

            expect(key1).toBeNull();
            expect(key2).toBeNull();
            expect(key3).toBeNull();
        });

        it("should cleanup expired entries", async () => {
            await cache.set("expired1", { data: 1 }, 50);
            await cache.set("expired2", { data: 2 }, 50);
            await cache.set("fresh", { data: 3 }, 10000);

            await new Promise((resolve) => setTimeout(resolve, 100));

            await cache.cleanup();

            const expired1 = await cache.get("expired1");
            const expired2 = await cache.get("expired2");
            const fresh = await cache.get("fresh");

            expect(expired1).toBeNull();
            expect(expired2).toBeNull();
            expect(fresh).toEqual({ data: 3 });
        });

        it("should set custom TTL values", () => {
            cache.setTTL("tools", 10000);
            cache.setTTL("health", 5000);
            cache.setTTL("metrics", 2000);

            expect(cache.getTTL("tools")).toBe(10000);
            expect(cache.getTTL("health")).toBe(5000);
            expect(cache.getTTL("metrics")).toBe(2000);
        });

        it("should delete specific cache entries", async () => {
            await cache.set("delete_me", { data: true });
            expect(await cache.get("delete_me")).toEqual({ data: true });

            await cache.delete("delete_me");
            expect(await cache.get("delete_me")).toBeNull();
        });

        it("should handle concurrent writes", async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(cache.set(`key_${i}`, { index: i }));
            }

            await Promise.all(promises);

            for (let i = 0; i < 10; i++) {
                const value = await cache.get(`key_${i}`);
                expect(value).toEqual({ index: i });
            }
        });
    });

    describe("Daemon Client", () => {
        it("should create client instance", () => {
            const client = new DaemonClient(daemonConfig);
            expect(client).toBeDefined();
        });

        it("should handle disconnected daemon gracefully", async () => {
            const client = new DaemonClient(daemonConfig);
            const result = await client.ping();
            expect(result).toBe(false);
        });

        it("should provide singleton instance", () => {
            const client1 = getDaemonClient(daemonConfig);
            const client2 = getDaemonClient(daemonConfig);
            expect(client1).toBe(client2);
        });

        it("should reset singleton", () => {
            const client1 = getDaemonClient(daemonConfig);
            resetDaemonClient();
            const client2 = getDaemonClient(daemonConfig);
            expect(client1).not.toBe(client2);
        });

        it("should handle timeout gracefully", async () => {
            const client = new DaemonClient(daemonConfig);
            const health = await client.getHealthStatus();
            expect(health).toBeNull();
        });
    });

    describe("Health Poller", () => {
        it("should create poller instance", () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            expect(poller).toBeDefined();
        });

        it("should manage poller status", async () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            expect(poller.getStatus().isRunning).toBe(false);

            await poller.start();
            expect(poller.getStatus().isRunning).toBe(true);

            poller.stop();
            expect(poller.getStatus().isRunning).toBe(false);
        });

        it("should emit status change events", async () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            const events: string[] = [];

            poller.on("status_change", (status: { isRunning: boolean }) => {
                events.push(status.isRunning ? "started" : "stopped");
            });

            await poller.start();
            poller.stop();

            expect(events).toContain("started");
            expect(events).toContain("stopped");
        });

        it("should provide poller statistics", async () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            const stats = await poller.getPolledStats();

            expect(stats).toHaveProperty("isDaemonRunning");
            expect(stats).toHaveProperty("lastHealthCheck");
            expect(stats).toHaveProperty("lastDiscoveryRefresh");
            expect(stats).toHaveProperty("errorCount");
        });

        it("should reset error counters", async () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            poller.resetErrorCounters();

            const status = poller.getStatus();
            expect(status.healthCheckErrors).toBe(0);
            expect(status.discoveryRefreshErrors).toBe(0);
        });

        it("should get singleton instance", () => {
            const poller1 = getHealthPoller(daemonConfig, undefined, cache);
            const poller2 = getHealthPoller(daemonConfig, undefined, cache);
            expect(poller1).toBe(poller2);
        });

        it("should update polling intervals", () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            poller.updateIntervals({
                healthCheckInterval: 10000,
                discoveryInterval: 15000,
            });

            expect(poller).toBeDefined(); // Should not throw
        });

        it("should cleanup resources", () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            expect(() => poller.cleanup()).not.toThrow();
        });
    });

    describe("Cache Manager Workflow", () => {
        it("should cache discovery results", async () => {
            const discoveryData = {
                tools: {
                    server1: [{ name: "tool1", description: "Test tool" }],
                    server2: [{ name: "tool2", description: "Another tool" }],
                },
                servers: ["server1", "server2"],
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000,
            };

            await cache.set("discovery_results", discoveryData, 5 * 60 * 1000);
            const retrieved = await cache.get("discovery_results");

            expect(retrieved).toEqual(discoveryData);
        });

        it("should cache health status", async () => {
            const healthData = {
                status: "healthy",
                timestamp: Date.now(),
                details: { uptime: 3600 },
            };

            await cache.set("daemon_health", healthData, 30 * 1000);
            const retrieved = await cache.get("daemon_health");

            expect(retrieved).toEqual(healthData);
        });

        it("should cache metrics", async () => {
            const metricsData = {
                uptime: 3600000,
                memoryMB: 128,
                cpuPercent: 5.2,
                requestsHandled: 1000,
                cacheHits: 500,
                cacheMisses: 100,
                timestamp: Date.now(),
            };

            await cache.set("daemon_metrics", metricsData, 60 * 1000);
            const retrieved = await cache.get("daemon_metrics");

            expect(retrieved).toEqual(metricsData);
        });

        it("should support cache invalidation", async () => {
            await cache.set("test", { value: 1 });
            expect(await cache.get("test")).toEqual({ value: 1 });

            await cache.delete("test");
            expect(await cache.get("test")).toBeNull();
        });
    });

    describe("Fallback Behavior", () => {
        it("should fallback when daemon unavailable", async () => {
            const client = new DaemonClient(daemonConfig);
            const tools = await client.getCachedTools();
            expect(tools).toBeNull(); // Daemon not running
        });

        it("should use cache as fallback", async () => {
            // Seed cache
            const cachedData = {
                tools: { test: [] },
                servers: ["test"],
                timestamp: Date.now() - 1000,
                ttl: 10 * 60 * 1000, // 10 minute TTL
            };

            await cache.set("daemon_tools", cachedData, 10 * 60 * 1000);

            // Attempt to get from cache
            const retrieved = await cache.get("daemon_tools");
            expect(retrieved).toEqual(cachedData);
        });

        it("should track cache hit rates", async () => {
            // Set some cache entries
            await cache.set("hit1", { data: 1 });
            await cache.set("hit2", { data: 2 });

            // Hit them
            await cache.get("hit1");
            await cache.get("hit1");
            await cache.get("hit2");

            // Miss
            await cache.get("miss");

            const stats = cache.getStats();
            expect(stats.cacheHits).toBe(3);
            expect(stats.cacheMisses).toBe(1);
            expect(stats.averageHitRate).toBe(0.75);
        });
    });

    describe("Error Handling", () => {
        it("should handle cache write errors", async () => {
            // Create read-only directory
            const readOnlyDir = path.join(tempDir, "readonly");
            fs.mkdirSync(readOnlyDir, { recursive: true });
            fs.chmodSync(readOnlyDir, 0o444);

            const readOnlyCache = new CacheManager();
            Object.defineProperty(readOnlyCache, "cacheDir", {
                value: readOnlyDir,
                writable: true,
            });

            // Should not throw, but fail gracefully
            await readOnlyCache.set("test", { data: "test" });

            // Cleanup
            fs.chmodSync(readOnlyDir, 0o755);
        });

        it("should handle concurrent operations", async () => {
            const operations = [];

            for (let i = 0; i < 20; i++) {
                if (i % 3 === 0) {
                    operations.push(cache.set(`key_${i}`, { index: i }));
                } else if (i % 3 === 1) {
                    operations.push(cache.get(`key_${i - 1}`));
                } else {
                    operations.push(cache.delete(`key_${i - 2}`));
                }
            }

            const results = await Promise.allSettled(operations);
            const failures = results.filter((r) => r.status === "rejected");
            expect(failures.length).toBe(0);
        });
    });

    describe("Integration Workflow", () => {
        it("should complete full daemon workflow", async () => {
            // 1. Initialize cache
            await cache.initialize();

            // 2. Cache discovery results
            const discovery = {
                tools: { server1: [{ name: "test_tool" }] },
                servers: ["server1"],
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000,
            };
            await cache.set("discovery_results", discovery, 5 * 60 * 1000);

            // 3. Cache health status
            const health = {
                status: "healthy",
                timestamp: Date.now(),
                details: {},
            };
            await cache.set("daemon_health", health, 30 * 1000);

            // 4. Verify retrieval
            const cachedDiscovery = await cache.get("discovery_results");
            const cachedHealth = await cache.get("daemon_health");

            expect(cachedDiscovery).toEqual(discovery);
            expect(cachedHealth).toEqual(health);

            // 5. Check stats
            const stats = cache.getStats();
            expect(stats.cacheHits).toBeGreaterThanOrEqual(0);
            expect(stats.cacheMisses).toBeGreaterThanOrEqual(0);
        });

        it("should handle poller startup with cache", async () => {
            const poller = new HealthPoller(daemonConfig, undefined, cache);

            // Register event listeners
            let eventCount = 0;
            poller.on("status_change", () => {
                eventCount++;
            });

            // Start poller
            await poller.start();

            // Stop poller
            poller.stop();

            // Should have received status change event
            expect(eventCount).toBeGreaterThan(0);
        });

        it("should provide complete observability", async () => {
            // Set up cache
            await cache.set("test", { value: "test" });

            // Get stats
            const cacheStats = cache.getStats();

            // Create poller
            const poller = new HealthPoller(daemonConfig, undefined, cache);
            const pollerStats = poller.getStatus();

            // Verify all data available
            expect(cacheStats).toHaveProperty("cacheHits");
            expect(cacheStats).toHaveProperty("cacheMisses");
            expect(pollerStats).toHaveProperty("isRunning");
            expect(pollerStats).toHaveProperty("isHealthy");
        });
    });
});
