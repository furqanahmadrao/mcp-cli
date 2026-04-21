/**
 * Windows Platform Support
 * 
 * Implements daemon lifecycle management for Windows using:
 * - Named pipes for IPC (instead of Unix sockets)
 * - Windows Event Log for logging
 * - Registry for configuration
 * - Task Scheduler for auto-start
 */

import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";

export interface WindowsDaemonConfig {
    daemonDir: string;
    serviceName: string;
    taskName: string;
    autoStart: boolean;
}

/**
 * WindowsPlatformManager - Windows-specific daemon operations
 */
export class WindowsPlatformManager {
    private config: WindowsDaemonConfig;

    constructor(config: WindowsDaemonConfig) {
        this.config = config;
    }

    /**
     * Get named pipe path for IPC on Windows
     */
    getNamedPipePath(pipeName: string = "mcp-daemon"): string {
        return `\\\\.\\pipe\\${pipeName}`;
    }

    /**
     * Register daemon auto-start via Task Scheduler
     */
    async registerAutoStart(): Promise<void> {
        if (!this.config.autoStart) {
            return;
        }

        const taskXml = this.generateTaskXml();
        const tempXmlPath = join(this.config.daemonDir, "task.xml");

        // Write task definition
        const fs = await import("fs").then((m) => m.promises);
        await fs.writeFile(tempXmlPath, taskXml);

        try {
            // Register task with Windows Task Scheduler
            execSync(
                `schtasks /create /tn "${this.config.taskName}" /xml "${tempXmlPath}" /f`,
                { encoding: "utf-8" }
            );
        } finally {
            // Cleanup temp file
            await fs.unlink(tempXmlPath).catch(() => {
                // Ignore cleanup errors
            });
        }
    }

    /**
     * Unregister auto-start task
     */
    async unregisterAutoStart(): Promise<void> {
        try {
            execSync(`schtasks /delete /tn "${this.config.taskName}" /f`, {
                encoding: "utf-8",
            });
        } catch {
            // Task might not exist
        }
    }

    /**
     * Generate XML for Task Scheduler
     */
    private generateTaskXml(): string {
        const daemonExe = join(this.config.daemonDir, "daemon.exe");
        const taskName = this.config.taskName;

        return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>MCP CLI Daemon - Background service for tool discovery caching</Description>
    <URI>\\MCP\\${taskName}</URI>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>%USERNAME%</UserId>
    </LogonTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <Duration>PT10M</Duration>
      <WaitTimeout>PT1H</WaitTimeout>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"${daemonExe}"</Command>
      <Arguments>start</Arguments>
    </Exec>
  </Actions>
</Task>`;
    }

    /**
     * Get Registry key path for daemon config
     */
    getRegistryPath(): string {
        return "HKEY_CURRENT_USER\\Software\\MCP\\Daemon";
    }

    /**
     * Read daemon setting from Windows Registry
     */
    async getRegistrySetting(key: string): Promise<string | null> {
        try {
            const output = execSync(
                `reg query "${this.getRegistryPath()}" /v "${key}"`,
                { encoding: "utf-8" }
            );

            // Parse registry output
            const match = output.match(/REG_SZ\s+(.+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    /**
     * Write daemon setting to Windows Registry
     */
    async setRegistrySetting(key: string, value: string): Promise<void> {
        const registryPath = this.getRegistryPath();
        const regKey = registryPath.split("\\").pop();
        const regHive = registryPath.split("\\")[0];

        execSync(
            `reg add "${registryPath}" /v "${key}" /t REG_SZ /d "${value}" /f`,
            { encoding: "utf-8" }
        );
    }

    /**
     * Check if daemon is running via Windows Process List
     */
    async isProcessRunning(processName: string = "mcp-daemon.exe"): Promise<boolean> {
        try {
            const output = execSync(`tasklist /FI "IMAGENAME eq ${processName}"`, {
                encoding: "utf-8",
            });

            return output.includes(processName);
        } catch {
            return false;
        }
    }

    /**
     * Kill daemon process on Windows
     */
    async killProcess(processName: string = "mcp-daemon.exe"): Promise<void> {
        try {
            execSync(`taskkill /IM ${processName} /F`, { encoding: "utf-8" });
        } catch {
            // Process might not be running
        }
    }

    /**
     * Write to Windows Event Log
     */
    async writeEventLog(
        source: string,
        message: string,
        type: "Information" | "Warning" | "Error" = "Information"
    ): Promise<void> {
        try {
            // Use PowerShell to write to Event Log
            const psCommand = `
Write-EventLog -LogName Application -Source "${source}" -EventId 1000 -EntryType ${type} -Message "${message.replace(/"/g, '\\"')}"
`;
            execSync(`powershell -Command "${psCommand}"`, { encoding: "utf-8" });
        } catch {
            // Event log write failed, continue anyway
        }
    }

    /**
     * Get daemon executable path for Windows
     */
    getDaemonExecutablePath(): string {
        return join(this.config.daemonDir, "daemon.exe");
    }

    /**
     * Setup Windows firewall exception
     */
    async setupFirewall(ruleName: string = "MCP Daemon"): Promise<void> {
        const exe = this.getDaemonExecutablePath();

        try {
            execSync(
                `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow program="${exe}" enable=yes`,
                { encoding: "utf-8" }
            );
        } catch {
            // Firewall rule might already exist
        }
    }

    /**
     * Remove Windows firewall exception
     */
    async removeFirewall(ruleName: string = "MCP Daemon"): Promise<void> {
        try {
            execSync(
                `netsh advfirewall firewall delete rule name="${ruleName}"`,
                { encoding: "utf-8" }
            );
        } catch {
            // Rule might not exist
        }
    }
}

/**
 * Create Windows platform manager
 */
export function createWindowsManager(daemonDir: string): WindowsPlatformManager {
    return new WindowsPlatformManager({
        daemonDir,
        serviceName: "McpDaemon",
        taskName: "MCP\\Daemon",
        autoStart: false,
    });
}
