/**
 * Daemon Logging System
 * 
 * Provides structured logging with:
 * - Multiple log levels (debug, info, warn, error)
 * - File rotation (50MB files)
 * - Log retention (7 days)
 * - Concurrent safe writes
 * - Structured JSON output option
 */

import { promises as fs, constants } from "fs";
import { join } from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    stack?: string;
}

export interface LoggerConfig {
    logDir: string;
    logFile: string;
    maxFileSize: number; // bytes
    maxFiles: number; // number of rotated files to keep
    level: LogLevel; // minimum log level
    json: boolean; // output JSON format
}

/**
 * DaemonLogger - Structured logging system with rotation
 */
export class DaemonLogger {
    private config: LoggerConfig;
    private logPath: string;
    private writeQueue: Promise<void> = Promise.resolve();
    private logLevels = { debug: 0, info: 1, warn: 2, error: 3 };

    constructor(config: LoggerConfig) {
        this.config = config;
        this.logPath = join(config.logDir, config.logFile);
    }

    /**
     * Initialize logger
     */
    async initialize(): Promise<void> {
        // Create log directory
        await fs.mkdir(this.config.logDir, { recursive: true });

        // Initialize empty log file if it doesn't exist
        try {
            await fs.access(this.logPath, constants.F_OK);
        } catch {
            await fs.writeFile(this.logPath, "");
        }
    }

    /**
     * Log debug message
     */
    debug(message: string, context?: Record<string, unknown>): void {
        this.log("debug", message, context);
    }

    /**
     * Log info message
     */
    info(message: string, context?: Record<string, unknown>): void {
        this.log("info", message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: Record<string, unknown>): void {
        this.log("warn", message, context);
    }

    /**
     * Log error message
     */
    error(message: string, error?: Error | Record<string, unknown>): void {
        const context = error instanceof Error ? { error: error.message } : error;
        const stack = error instanceof Error ? error.stack : undefined;
        this.logWithStack("error", message, context, stack);
    }

    /**
     * Internal log method
     */
    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        this.logWithStack(level, message, context, undefined);
    }

    /**
     * Internal log method with stack trace
     */
    private logWithStack(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        stack?: string
    ): void {
        // Check if we should log this level
        if (
            this.logLevels[level] < this.logLevels[this.config.level]
        ) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            stack,
        };

        // Queue write to avoid interleaving
        this.writeQueue = this.writeQueue
            .then(() => this.writeEntry(entry))
            .catch((err) => {
                console.error("Failed to write log entry:", err);
            });
    }

    /**
     * Write log entry to file with rotation check
     */
    private async writeEntry(entry: LogEntry): Promise<void> {
        try {
            // Check if rotation needed
            await this.checkAndRotate();

            // Format entry
            const line = this.formatEntry(entry);

            // Append to log file
            await fs.appendFile(this.logPath, line + "\n");
        } catch (error) {
            console.error("Error writing log entry:", error);
        }
    }

    /**
     * Format log entry
     */
    private formatEntry(entry: LogEntry): string {
        if (this.config.json) {
            return JSON.stringify(entry);
        }

        const levelStr = entry.level.toUpperCase().padEnd(5);
        let line = `${entry.timestamp} [${levelStr}] ${entry.message}`;

        if (entry.context) {
            line += ` ${JSON.stringify(entry.context)}`;
        }

        if (entry.stack) {
            line += `\n${entry.stack}`;
        }

        return line;
    }

    /**
     * Check if file needs rotation
     */
    private async checkAndRotate(): Promise<void> {
        try {
            const stats = await fs.stat(this.logPath);

            if (stats.size >= this.config.maxFileSize) {
                await this.rotateLog();
            }
        } catch (error) {
            // File might not exist yet
        }
    }

    /**
     * Rotate log file
     */
    private async rotateLog(): Promise<void> {
        const basename = this.config.logFile.replace(/\.\w+$/, "");
        const extension = this.config.logFile.substring(basename.length);
        const logDir = this.config.logDir;

        // Remove oldest file if at max
        for (let i = this.config.maxFiles; i > 1; i--) {
            const oldPath = join(logDir, `${basename}${i}${extension}`);
            try {
                await fs.unlink(oldPath);
            } catch {
                // File might not exist
            }
        }

        // Rotate existing files
        for (let i = this.config.maxFiles - 1; i > 0; i--) {
            const oldPath = join(logDir, `${basename}${i}${extension}`);
            const newPath = join(logDir, `${basename}${i + 1}${extension}`);

            try {
                await fs.rename(oldPath, newPath);
            } catch {
                // File might not exist
            }
        }

        // Rotate current file
        const rotatedPath = join(logDir, `${basename}1${extension}`);
        try {
            await fs.rename(this.logPath, rotatedPath);
            await fs.writeFile(this.logPath, "");
        } catch (error) {
            console.error("Error rotating log file:", error);
        }
    }

    /**
     * Get recent log entries
     */
    async getRecentLogs(lines: number = 50): Promise<LogEntry[]> {
        try {
            const content = await fs.readFile(this.logPath, "utf-8");
            const logLines = content
                .split("\n")
                .filter((line) => line.trim())
                .slice(-lines);

            const entries: LogEntry[] = [];

            for (const line of logLines) {
                try {
                    let entry: LogEntry;

                    if (this.config.json) {
                        entry = JSON.parse(line);
                    } else {
                        entry = this.parseTextEntry(line);
                    }

                    entries.push(entry);
                } catch {
                    // Parse error, skip line
                }
            }

            return entries;
        } catch (error) {
            console.error("Error reading logs:", error);
            return [];
        }
    }

    /**
     * Parse text format log entry
     */
    private parseTextEntry(line: string): LogEntry {
        // Format: 2026-04-11T12:34:56.789Z [INFO ] message context
        const match = line.match(
            /^(\d{4}-\d{2}-\d{2}T[\d:.Z]+)\s+\[(\w+)\]\s+(.+)$/
        );

        if (!match) {
            return {
                timestamp: new Date().toISOString(),
                level: "info",
                message: line,
            };
        }

        const [, timestamp, level, rest] = match;

        // Try to parse context as JSON
        let message = rest;
        let context: Record<string, unknown> | undefined;

        const jsonMatch = rest.match(/^(.+?)\s+(\{.+\})$/);
        if (jsonMatch) {
            message = jsonMatch[1];
            try {
                context = JSON.parse(jsonMatch[2]);
            } catch {
                // Not JSON, include in message
            }
        }

        return {
            timestamp,
            level: (level.toLowerCase() as LogLevel) || "info",
            message,
            context,
        };
    }

    /**
     * Clear all log files
     */
    async clear(): Promise<void> {
        const basename = this.config.logFile.replace(/\.\w+$/, "");
        const extension = this.config.logFile.substring(basename.length);
        const logDir = this.config.logDir;

        for (let i = 0; i <= this.config.maxFiles; i++) {
            const path =
                i === 0
                    ? this.logPath
                    : join(logDir, `${basename}${i}${extension}`);

            try {
                await fs.unlink(path);
            } catch {
                // File might not exist
            }
        }

        // Recreate empty log file
        await fs.writeFile(this.logPath, "");
    }

    /**
     * Get log file size in bytes
     */
    async getLogSize(): Promise<number> {
        try {
            const stats = await fs.stat(this.logPath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    /**
     * Get all log file paths (current + rotated)
     */
    async getLogFiles(): Promise<string[]> {
        const basename = this.config.logFile.replace(/\.\w+$/, "");
        const extension = this.config.logFile.substring(basename.length);
        const logDir = this.config.logDir;

        const files: string[] = [];

        for (let i = 0; i <= this.config.maxFiles; i++) {
            const path =
                i === 0
                    ? this.logPath
                    : join(logDir, `${basename}${i}${extension}`);

            try {
                await fs.access(path, constants.F_OK);
                files.push(path);
            } catch {
                // File doesn't exist
            }
        }

        return files;
    }

    /**
     * Cleanup old log files (retention policy)
     */
    async cleanup(retentionDays: number = 7): Promise<number> {
        const now = Date.now();
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
        let removed = 0;

        const logFiles = await this.getLogFiles();

        for (const filepath of logFiles) {
            try {
                const stats = await fs.stat(filepath);
                const age = now - stats.mtimeMs;

                if (age > retentionMs) {
                    await fs.unlink(filepath);
                    removed++;
                }
            } catch {
                // Could not check/delete file
            }
        }

        return removed;
    }
}

/**
 * Create logger instance
 */
export function createLogger(logDir: string, level: LogLevel = "info"): DaemonLogger {
    return new DaemonLogger({
        logDir,
        logFile: "daemon.log",
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10, // Keep 10 rotated files
        level,
        json: false,
    });
}
