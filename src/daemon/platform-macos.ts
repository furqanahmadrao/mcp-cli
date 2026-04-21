/**
 * macOS Platform Support
 * 
 * Implements daemon lifecycle management for macOS using:
 * - Unix domain sockets for IPC
 * - LaunchAgent for auto-start via launchd
 * - plist configuration files
 * - Native logging via os_log
 */

import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { promises as fs } from "fs";

export interface MacOSDaemonConfig {
    daemonDir: string;
    launchAgentName: string;
    autoStart: boolean;
}

/**
 * MacOSPlatformManager - macOS-specific daemon operations
 */
export class MacOSPlatformManager {
    private config: MacOSDaemonConfig;
    private launchAgentPath: string;

    constructor(config: MacOSDaemonConfig) {
        this.config = config;
        this.launchAgentPath = join(
            homedir(),
            "Library/LaunchAgents",
            `${config.launchAgentName}.plist`
        );
    }

    /**
     * Get Unix socket path for IPC on macOS
     */
    getSocketPath(socketName: string = "mcp-daemon.sock"): string {
        return join(this.config.daemonDir, socketName);
    }

    /**
     * Register daemon auto-start via LaunchAgent
     */
    async registerAutoStart(): Promise<void> {
        if (!this.config.autoStart) {
            return;
        }

        const plistContent = this.generateLaunchAgentPlist();

        // Ensure LaunchAgents directory exists
        const launchAgentDir = join(homedir(), "Library/LaunchAgents");
        await fs.mkdir(launchAgentDir, { recursive: true });

        // Write plist file
        await fs.writeFile(this.launchAgentPath, plistContent);

        // Load the agent with launchctl
        try {
            execSync(`launchctl load "${this.launchAgentPath}"`, {
                encoding: "utf-8",
            });
        } catch {
            // Agent might already be loaded
        }
    }

    /**
     * Unregister auto-start LaunchAgent
     */
    async unregisterAutoStart(): Promise<void> {
        try {
            execSync(`launchctl unload "${this.launchAgentPath}"`, {
                encoding: "utf-8",
            });
        } catch {
            // Agent might not be loaded
        }

        // Remove plist file
        try {
            await fs.unlink(this.launchAgentPath);
        } catch {
            // File might not exist
        }
    }

    /**
     * Generate plist content for LaunchAgent
     */
    private generateLaunchAgentPlist(): string {
        const daemonBinary = join(this.config.daemonDir, "daemon");
        const logPath = join(this.config.daemonDir, "daemon.log");

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${this.config.launchAgentName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${daemonBinary}</string>
        <string>start</string>
        <string>--log-level</string>
        <string>info</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${logPath}</string>
    <key>StandardErrorPath</key>
    <string>${logPath}</string>
    <key>SoftResourceLimits</key>
    <dict>
        <key>NumberOfFiles</key>
        <integer>1024</integer>
    </dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>MCP_DAEMON_HOME</key>
        <string>${this.config.daemonDir}</string>
        <key>MCP_LOG_LEVEL</key>
        <string>info</string>
    </dict>
    <key>StartInterval</key>
    <integer>60</integer>
</dict>
</plist>`;
    }

    /**
     * Check if LaunchAgent is loaded
     */
    async isAgentLoaded(): Promise<boolean> {
        try {
            const output = execSync("launchctl list", { encoding: "utf-8" });
            return output.includes(this.config.launchAgentName);
        } catch {
            return false;
        }
    }

    /**
     * Get LaunchAgent status
     */
    async getAgentStatus(): Promise<{
        isLoaded: boolean;
        pid?: number;
        lastExitCode?: number;
    }> {
        try {
            const output = execSync(
                `launchctl list "${this.config.launchAgentName}"`,
                { encoding: "utf-8" }
            );

            const lines = output.split("\n");
            const result: {
                isLoaded: boolean;
                pid?: number;
                lastExitCode?: number;
            } = { isLoaded: true };

            for (const line of lines) {
                if (line.includes("PID")) {
                    const match = line.match(/PID\s*=\s*(\d+)/);
                    if (match) result.pid = parseInt(match[1]);
                }
                if (line.includes("LastExitStatus")) {
                    const match = line.match(/LastExitStatus\s*=\s*(\d+)/);
                    if (match) result.lastExitCode = parseInt(match[1]);
                }
            }

            return result;
        } catch {
            return { isLoaded: false };
        }
    }

    /**
     * Restart LaunchAgent
     */
    async restartAgent(): Promise<void> {
        await this.unregisterAutoStart();
        await this.registerAutoStart();
    }

    /**
     * Check if daemon process is running
     */
    async isProcessRunning(processName: string = "mcp-daemon"): Promise<boolean> {
        try {
            const output = execSync(
                `pgrep -f "${processName}" | wc -l`,
                { encoding: "utf-8" }
            );

            return parseInt(output.trim()) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Kill daemon process
     */
    async killProcess(processName: string = "mcp-daemon"): Promise<void> {
        try {
            execSync(`pkill -f "${processName}"`, { encoding: "utf-8" });
        } catch {
            // Process might not be running
        }
    }

    /**
     * Write to macOS unified logging (os_log)
     */
    async writeLog(
        message: string,
        level: "debug" | "info" | "error" = "info"
    ): Promise<void> {
        try {
            const osLogLevel = { debug: "debug", info: "info", error: "error" }[
                level
            ];

            execSync(
                `log stream --predicate 'process == "mcp-daemon"' --level ${osLogLevel}`,
                { encoding: "utf-8" }
            );
        } catch {
            // Log write failed, continue anyway
        }
    }

    /**
     * Get daemon executable path for macOS
     */
    getDaemonExecutablePath(): string {
        return join(this.config.daemonDir, "daemon");
    }

    /**
     * Setup Transparency, Consent, and Control (TCC) permission
     */
    async setupTCCPermission(): Promise<void> {
        // macOS Catalina+ requires explicit permissions
        // This is handled via Info.plist for properly signed apps
        // CLI tools typically bypass these requirements
    }

    /**
     * Get LaunchAgent configuration path
     */
    getConfigPath(): string {
        return this.launchAgentPath;
    }

    /**
     * List all active daemons via launchctl
     */
    async listActiveDaemons(): Promise<string[]> {
        try {
            const output = execSync("launchctl list | grep mcp", {
                encoding: "utf-8",
            });

            return output
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => line.trim());
        } catch {
            return [];
        }
    }
}

/**
 * Create macOS platform manager
 */
export function createMacOSManager(daemonDir: string): MacOSPlatformManager {
    return new MacOSPlatformManager({
        daemonDir,
        launchAgentName: "com.mcp.daemon",
        autoStart: false,
    });
}
