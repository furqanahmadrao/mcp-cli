/**
 * Linux Platform Support
 * 
 * Implements daemon lifecycle management for Linux using:
 * - Unix domain sockets for IPC
 * - systemd user services for auto-start
 * - systemctl for service management
 * - Native syslog logging
 */

import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { promises as fs } from "fs";

export interface LinuxDaemonConfig {
    daemonDir: string;
    serviceName: string;
    autoStart: boolean;
}

/**
 * LinuxPlatformManager - Linux-specific daemon operations
 */
export class LinuxPlatformManager {
    private config: LinuxDaemonConfig;
    private systemdUserDir: string;
    private systemdUnitPath: string;

    constructor(config: LinuxDaemonConfig) {
        this.config = config;
        this.systemdUserDir = join(
            homedir(),
            ".config/systemd/user"
        );
        this.systemdUnitPath = join(
            this.systemdUserDir,
            `${config.serviceName}.service`
        );
    }

    /**
     * Get Unix socket path for IPC on Linux
     */
    getSocketPath(socketName: string = "mcp-daemon.sock"): string {
        return join(this.config.daemonDir, socketName);
    }

    /**
     * Register daemon auto-start via systemd user service
     */
    async registerAutoStart(): Promise<void> {
        if (!this.config.autoStart) {
            return;
        }

        const unitContent = this.generateSystemdUnit();

        // Ensure systemd user directory exists
        await fs.mkdir(this.systemdUserDir, { recursive: true });

        // Write unit file
        await fs.writeFile(this.systemdUnitPath, unitContent);

        // Reload systemd and enable service
        try {
            execSync("systemctl --user daemon-reload", { encoding: "utf-8" });
            execSync(`systemctl --user enable ${this.config.serviceName}`, {
                encoding: "utf-8",
            });
        } catch {
            // systemctl might not be available in all environments
        }
    }

    /**
     * Unregister auto-start systemd service
     */
    async unregisterAutoStart(): Promise<void> {
        try {
            execSync(`systemctl --user disable ${this.config.serviceName}`, {
                encoding: "utf-8",
            });
        } catch {
            // Service might not be installed
        }

        try {
            execSync("systemctl --user daemon-reload", { encoding: "utf-8" });
        } catch {
            // Ignore
        }

        // Remove unit file
        try {
            await fs.unlink(this.systemdUnitPath);
        } catch {
            // File might not exist
        }
    }

    /**
     * Generate systemd user service unit file
     */
    private generateSystemdUnit(): string {
        const daemonBinary = join(this.config.daemonDir, "daemon");
        const logPath = join(this.config.daemonDir, "daemon.log");

        return `[Unit]
Description=MCP CLI Daemon - Background service for tool discovery caching
Documentation=https://github.com/ModelContextProtocol/mcp-cli
After=network.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${daemonBinary} start
Restart=always
RestartSec=5
StandardOutput=append:${logPath}
StandardError=append:${logPath}
Environment="MCP_DAEMON_HOME=${this.config.daemonDir}"
Environment="MCP_LOG_LEVEL=info"

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
PrivateTmp=yes
NoNewPrivileges=true

[Install]
WantedBy=default.target`;
    }

    /**
     * Check if service is enabled
     */
    async isServiceEnabled(): Promise<boolean> {
        try {
            execSync(
                `systemctl --user is-enabled ${this.config.serviceName}`,
                { encoding: "utf-8" }
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if service is active/running
     */
    async isServiceActive(): Promise<boolean> {
        try {
            execSync(
                `systemctl --user is-active ${this.config.serviceName}`,
                { encoding: "utf-8" }
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get service status
     */
    async getServiceStatus(): Promise<{
        isActive: boolean;
        isEnabled: boolean;
        pid?: number;
        memoryUsage?: number;
    }> {
        const isActive = await this.isServiceActive();
        const isEnabled = await this.isServiceEnabled();

        const result: {
            isActive: boolean;
            isEnabled: boolean;
            pid?: number;
            memoryUsage?: number;
        } = { isActive, isEnabled };

        if (isActive) {
            try {
                const output = execSync(
                    `systemctl --user show -p MainPID -p MemoryCurrent ${this.config.serviceName}`,
                    { encoding: "utf-8" }
                );

                const pidMatch = output.match(/MainPID=(\d+)/);
                if (pidMatch) result.pid = parseInt(pidMatch[1]);

                const memMatch = output.match(/MemoryCurrent=(\d+)/);
                if (memMatch) result.memoryUsage = parseInt(memMatch[1]);
            } catch {
                // Could not get status details
            }
        }

        return result;
    }

    /**
     * Start service
     */
    async startService(): Promise<void> {
        try {
            execSync(`systemctl --user start ${this.config.serviceName}`, {
                encoding: "utf-8",
            });
        } catch {
            // Service start failed
        }
    }

    /**
     * Stop service
     */
    async stopService(): Promise<void> {
        try {
            execSync(`systemctl --user stop ${this.config.serviceName}`, {
                encoding: "utf-8",
            });
        } catch {
            // Service might not be running
        }
    }

    /**
     * Restart service
     */
    async restartService(): Promise<void> {
        try {
            execSync(`systemctl --user restart ${this.config.serviceName}`, {
                encoding: "utf-8",
            });
        } catch {
            // Service restart failed
        }
    }

    /**
     * Check if daemon process is running
     */
    async isProcessRunning(processName: string = "mcp-daemon"): Promise<boolean> {
        try {
            const output = execSync(`pgrep -f "${processName}" | wc -l`, {
                encoding: "utf-8",
            });

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
     * Write to syslog
     */
    async writeSyslog(
        message: string,
        level: "debug" | "info" | "warning" | "error" = "info"
    ): Promise<void> {
        const priority = {
            debug: "debug",
            info: "info",
            warning: "warning",
            error: "err",
        }[level];

        try {
            execSync(`logger -t mcp-daemon -p user.${priority} "${message}"`, {
                encoding: "utf-8",
            });
        } catch {
            // Syslog write failed, continue anyway
        }
    }

    /**
     * Read recent syslog entries
     */
    async readSyslog(lines: number = 50): Promise<string[]> {
        try {
            const output = execSync(
                `journalctl --user-unit=${this.config.serviceName} -n ${lines}`,
                { encoding: "utf-8" }
            );

            return output.split("\n").filter((line) => line.trim());
        } catch {
            try {
                // Fallback to syslog command
                const output = execSync(`tail -n ${lines} /var/log/syslog`, {
                    encoding: "utf-8",
                });

                return output
                    .split("\n")
                    .filter((line) => line.includes("mcp-daemon"));
            } catch {
                return [];
            }
        }
    }

    /**
     * Get daemon executable path for Linux
     */
    getDaemonExecutablePath(): string {
        return join(this.config.daemonDir, "daemon");
    }

    /**
     * Setup environment file for service
     */
    async setupEnvironmentFile(): Promise<void> {
        const envPath = join(this.config.daemonDir, "daemon.env");
        const envContent = `MCP_DAEMON_HOME=${this.config.daemonDir}
MCP_LOG_LEVEL=info
MCP_LOG_FILE=${join(this.config.daemonDir, "daemon.log")}
`;

        await fs.writeFile(envPath, envContent);
    }

    /**
     * Get systemd unit file path
     */
    getUnitFilePath(): string {
        return this.systemdUnitPath;
    }

    /**
     * List all MCP-related systemd services
     */
    async listServices(): Promise<string[]> {
        try {
            const output = execSync("systemctl --user list-units --type=service", {
                encoding: "utf-8",
            });

            return output
                .split("\n")
                .filter((line) => line.includes("mcp"))
                .map((line) => line.trim());
        } catch {
            return [];
        }
    }
}

/**
 * Create Linux platform manager
 */
export function createLinuxManager(daemonDir: string): LinuxPlatformManager {
    return new LinuxPlatformManager({
        daemonDir,
        serviceName: "mcp-daemon",
        autoStart: false,
    });
}
