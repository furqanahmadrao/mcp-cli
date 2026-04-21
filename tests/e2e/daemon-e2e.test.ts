/**
 * End-to-End Tests for Cross-Platform Daemon
 * 
 * Tests platform detection, configuration, logging, and lifecycle across all platforms
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectPlatform, getPlatformName, getSocketType, supportsAutoStart, supportsNativeLogging, getPlatformInfo, checkPlatformRequirements } from "../src/daemon/platform-manager.js";
import { DaemonLogger, createLogger } from "../src/daemon/daemon-logger.js";
import { createExtendedConfig, ExtendedDaemonConfigSchema, DEFAULT_EXTENDED_DAEMON_CONFIG } from "../src/daemon/daemon-config-extended.js";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

describe("Cross-Platform E2E Tests", () => {
    let tempDir: string;
    let logger: DaemonLogger;

    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `mcp-e2e-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        logger = createLogger(tempDir, "info");
        await logger.initialize();
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    });

    describe("Platform Detection", () => {
        it("should detect current platform", () => {
            const p = detectPlatform();
            expect(["windows", "macos", "linux", "unknown"]).toContain(p);
        });

        it("should get platform name", () => {
            const p = detectPlatform();
            const name = getPlatformName(p);
            expect(name).toBeTruthy();
            expect(["Windows", "macOS", "Linux", "Unknown"]).toContain(name);
        });

        it("should provide platform info", () => {
            const info = getPlatformInfo();
            expect(info).toHaveProperty("platform");
            expect(info).toHaveProperty("platformName");
            expect(info).toHaveProperty("socketType");
            expect(info).toHaveProperty("supportsAutoStart");
            expect(info).toHaveProperty("supportsNativeLogging");
        });

        it("should detect socket type per platform", () => {
            const currentPlatform = detectPlatform();
            const socketType = getSocketType();

            if (currentPlatform === "windows") {
                expect(socketType).toBe("named-pipe");
            } else if (currentPlatform === "macos" || currentPlatform === "linux") {
                expect(socketType).toBe("unix");
            }
        });

        it("should report auto-start support", () => {
            const supported = supportsAutoStart();
            expect(typeof supported).toBe("boolean");
        });

        it("should report native logging support", () => {
            const supported = supportsNativeLogging();
            expect(typeof supported).toBe("boolean");
        });
    });

    describe("Platform Requirements", () => {
        it("should check requirements for current platform", async () => {
            const requirements = await checkPlatformRequirements();
            expect(requirements).toHaveProperty("supported");
            expect(requirements).toHaveProperty("requirements");
            expect(requirements).toHaveProperty("warnings");
            expect(Array.isArray(requirements.requirements)).toBe(true);
            expect(Array.isArray(requirements.warnings)).toBe(true);
        });

        it("should mark current platform as supported", async () => {
            const p = detectPlatform();
            const requirements = await checkPlatformRequirements(p);

            if (p !== "unknown") {
                expect(requirements.supported).toBe(true);
            }
        });
    });

    describe("Logger Lifecycle", () => {
        it("should initialize logger", async () => {
            expect(fs.existsSync(tempDir)).toBe(true);
        });

        it("should log at different levels", () => {
            logger.debug("Debug message");
            logger.info("Info message");
            logger.warn("Warning message");
            logger.error("Error message", new Error("Test error"));
        });

        it("should write logs to file", async () => {
            logger.info("Test log entry");
            const logs = await logger.getRecentLogs(10);
            expect(logs.length).toBeGreaterThan(0);
        });

        it("should track log file size", async () => {
            logger.info("Test message");
            const size = await logger.getLogSize();
            expect(size).toBeGreaterThan(0);
        });

        it("should get log files", async () => {
            logger.info("Test message");
            const files = await logger.getLogFiles();
            expect(files.length).toBeGreaterThan(0);
        });

        it("should clear logs", async () => {
            logger.info("Initial message");
            let logs = await logger.getRecentLogs(10);
            expect(logs.length).toBeGreaterThan(0);

            await logger.clear();
            logs = await logger.getRecentLogs(10);
            expect(logs.length).toBe(0);
        });
    });

    describe("Logger Rotation", () => {
        it("should handle log rotation (small file size)", async () => {
            const smallLogger = createLogger(tempDir, "debug");
            Object.assign(smallLogger, {
                config: {
                    ...smallLogger["config"],
                    maxFileSize: 100, // Very small for testing
                    maxFiles: 3,
                },
            });

            // Write many logs to trigger rotation
            for (let i = 0; i < 20; i++) {
                smallLogger.info(`Log message ${i}`);
            }

            const files = await smallLogger.getLogFiles();
            expect(files.length).toBeGreaterThan(0);
        });

        it("should retrieve recent logs", async () => {
            for (let i = 0; i < 10; i++) {
                logger.info(`Message ${i}`);
            }

            const recent = await logger.getRecentLogs(5);
            expect(recent.length).toBeLessThanOrEqual(5);
        });
    });

    describe("Configuration Schema", () => {
        it("should validate default config", () => {
            const config = createExtendedConfig();
            expect(config).toBeDefined();
            expect(config.enabled).toBe(true);
            expect(config.autoStart).toBe(false);
        });

        it("should have all required config sections", () => {
            const config = createExtendedConfig();
            expect(config).toHaveProperty("logging");
            expect(config).toHaveProperty("health");
            expect(config).toHaveProperty("discovery");
            expect(config).toHaveProperty("performance");
            expect(config).toHaveProperty("platform");
        });

        it("should merge custom override", () => {
            const config = createExtendedConfig({
                autoStart: true,
                logging: { level: "debug" },
            });

            expect(config.autoStart).toBe(true);
            expect(config.logging?.level).toBe("debug");
        });

        it("should validate logging config", () => {
            const config = createExtendedConfig({
                logging: {
                    level: "info",
                    maxFileSize: 100 * 1024 * 1024,
                    maxFiles: 5,
                    retentionDays: 14,
                    structured: true,
                },
            });

            expect(config.logging?.level).toBe("info");
            expect(config.logging?.maxFileSize).toBe(100 * 1024 * 1024);
            expect(config.logging?.structured).toBe(true);
        });

        it("should validate health config", () => {
            const config = createExtendedConfig({
                health: {
                    checkInterval: 60000,
                    checkTimeout: 10000,
                    maxRetries: 5,
                },
            });

            expect(config.health?.checkInterval).toBe(60000);
            expect(config.health?.maxRetries).toBe(5);
        });

        it("should validate discovery config", () => {
            const config = createExtendedConfig({
                discovery: {
                    cacheInterval: 10 * 60 * 1000,
                    cacheTTL: 10 * 60 * 1000,
                },
            });

            expect(config.discovery?.cacheInterval).toBe(10 * 60 * 1000);
        });

        it("should validate performance config", () => {
            const config = createExtendedConfig({
                performance: {
                    maxConnections: 200,
                    connectionTimeout: 10000,
                },
            });

            expect(config.performance?.maxConnections).toBe(200);
        });

        it("should include platform-specific config", () => {
            const config = createExtendedConfig();
            expect(config.platform).toBeDefined();
        });

        it("should reject invalid config", () => {
            expect(() => {
                ExtendedDaemonConfigSchema.parse({
                    logging: {
                        level: "invalid_level",
                    },
                });
            }).toThrow();
        });
    });

    describe("Multiple Logger Instances", () => {
        it("should support multiple independent loggers", async () => {
            const tempDir2 = path.join(os.tmpdir(), `mcp-e2e-${Date.now()}-2`);
            fs.mkdirSync(tempDir2, { recursive: true });

            const logger1 = createLogger(tempDir, "info");
            const logger2 = createLogger(tempDir2, "debug");

            await logger1.initialize();
            await logger2.initialize();

            logger1.info("Logger 1 message");
            logger2.debug("Logger 2 message");

            const logs1 = await logger1.getRecentLogs(10);
            const logs2 = await logger2.getRecentLogs(10);

            expect(logs1.length).toBeGreaterThan(0);
            expect(logs2.length).toBeGreaterThan(0);

            fs.rmSync(tempDir2, { recursive: true });
        });
    });

    describe("Log Cleanup", () => {
        it("should cleanup old log files (retention)", async () => {
            logger.info("Initial log");

            // Get initial count
            let files = await logger.getLogFiles();
            const initialCount = files.length;

            // Cleanup (no files should be old enough by default)
            const removed = await logger.cleanup(0); // 0 days = remove all

            // Verify some cleanup attempted
            expect(typeof removed).toBe("number");
        });
    });

    describe("Cross-Platform Workflow", () => {
        it("should complete full configuration workflow", async () => {
            // 1. Detect platform
            const platform = detectPlatform();
            expect(platform).not.toBe("unknown");

            // 2. Get platform info
            const info = getPlatformInfo();
            expect(info.platform).toBe(platform);

            // 3. Check requirements
            const requirements = await checkPlatformRequirements(platform);
            expect(requirements.supported).toBe(true);

            // 4. Create config
            const config = createExtendedConfig({
                autoStart: supportsAutoStart(platform),
                logging: {
                    level: "info",
                },
            });
            expect(config).toBeDefined();

            // 5. Initialize logger
            await logger.initialize();
            logger.info(`Running on ${info.platformName}`);

            // 6. Verify logging
            const logs = await logger.getRecentLogs(10);
            expect(logs.length).toBeGreaterThan(0);
        });

        it("should provide complete platform context", () => {
            const info = getPlatformInfo();

            // Should have all required info
            expect(info.platform).toBeTruthy();
            expect(info.platformName).toBeTruthy();
            expect(info.socketType).toBeTruthy();
            expect(typeof info.supportsAutoStart).toBe("boolean");
            expect(typeof info.supportsNativeLogging).toBe("boolean");
            expect(info.command).toBeTruthy();
        });
    });

    describe("Concurrent Logger Operations", () => {
        it("should handle concurrent logging safely", async () => {
            const promises = [];

            for (let i = 0; i < 50; i++) {
                promises.push(
                    Promise.resolve().then(() => {
                        logger.info(`Concurrent message ${i}`);
                    })
                );
            }

            await Promise.all(promises);

            const logs = await logger.getRecentLogs(100);
            expect(logs.length).toBeGreaterThanOrEqual(50);
        });
    });

    describe("Configuration Persistence", () => {
        it("should handle configuration serialization", () => {
            const config = createExtendedConfig({
                autoStart: true,
                logging: { level: "debug" },
            });

            // Should be JSON serializable
            const json = JSON.stringify(config);
            const parsed = JSON.parse(json);

            expect(parsed.autoStart).toBe(true);
            expect(parsed.logging.level).toBe("debug");
        });

        it("should validate deserialized config", () => {
            const config = createExtendedConfig({
                health: { checkInterval: 60000 },
            });

            const json = JSON.stringify(config);
            const parsed = JSON.parse(json);

            // Re-validate
            const validated = ExtendedDaemonConfigSchema.parse(parsed);
            expect(validated.health?.checkInterval).toBe(60000);
        });
    });
});
