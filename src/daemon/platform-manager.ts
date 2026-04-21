/**
 * Platform Abstraction Layer
 * 
 * Provides unified interface for cross-platform daemon operations
 * Selects appropriate implementation based on OS at runtime
 */

import { platform } from "os";
import { WindowsPlatformManager, createWindowsManager } from "./platform-windows.js";
import { MacOSPlatformManager, createMacOSManager } from "./platform-macos.js";
import { LinuxPlatformManager, createLinuxManager } from "./platform-linux.js";

export type Platform = "windows" | "macos" | "linux" | "unknown";

export interface PlatformManager {
    getSocketPath(socketName?: string): string;
    registerAutoStart(): Promise<void>;
    unregisterAutoStart(): Promise<void>;
    isProcessRunning(processName?: string): Promise<boolean>;
    killProcess(processName?: string): Promise<void>;
    getDaemonExecutablePath(): string;
}

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
    const p = platform();
    switch (p) {
        case "win32":
            return "windows";
        case "darwin":
            return "macos";
        case "linux":
            return "linux";
        default:
            return "unknown";
    }
}

/**
 * Get platform name for display
 */
export function getPlatformName(p: Platform): string {
    switch (p) {
        case "windows":
            return "Windows";
        case "macos":
            return "macOS";
        case "linux":
            return "Linux";
        default:
            return "Unknown";
    }
}

/**
 * Create appropriate platform manager
 */
export function createPlatformManager(daemonDir: string): PlatformManager {
    const currentPlatform = detectPlatform();

    switch (currentPlatform) {
        case "windows":
            return createWindowsManager(daemonDir);
        case "macos":
            return createMacOSManager(daemonDir);
        case "linux":
            return createLinuxManager(daemonDir);
        default:
            throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
}

/**
 * Create platform-specific manager with type casting
 */
export function createPlatformManagerTyped(daemonDir: string): {
    windows?: WindowsPlatformManager;
    macos?: MacOSPlatformManager;
    linux?: LinuxPlatformManager;
    active: PlatformManager;
} {
    const current = detectPlatform();
    const result: {
        windows?: WindowsPlatformManager;
        macos?: MacOSPlatformManager;
        linux?: LinuxPlatformManager;
        active: PlatformManager;
    } = {
        active: createPlatformManager(daemonDir),
    };

    // Support accessing all managers for testing
    if (current === "windows" || true) {
        result.windows = createWindowsManager(daemonDir);
    }
    if (current === "macos" || true) {
        result.macos = createMacOSManager(daemonDir);
    }
    if (current === "linux" || true) {
        result.linux = createLinuxManager(daemonDir);
    }

    return result;
}

/**
 * Get socket path for current platform
 */
export function getSocketPath(daemonDir: string, socketName?: string): string {
    const manager = createPlatformManager(daemonDir);
    return manager.getSocketPath(socketName);
}

/**
 * Check if platform supports auto-start
 */
export function supportsAutoStart(p?: Platform): boolean {
    const targetPlatform = p || detectPlatform();
    // All platforms supported for auto-start
    return targetPlatform !== "unknown";
}

/**
 * Check if platform supports native logging
 */
export function supportsNativeLogging(p?: Platform): boolean {
    const targetPlatform = p || detectPlatform();

    switch (targetPlatform) {
        case "windows":
            return true; // Windows Event Log
        case "macos":
            return true; // os_log
        case "linux":
            return true; // syslog / journalctl
        default:
            return false;
    }
}

/**
 * Get platform-specific socket type
 */
export function getSocketType(p?: Platform): "unix" | "named-pipe" {
    const targetPlatform = p || detectPlatform();

    switch (targetPlatform) {
        case "windows":
            return "named-pipe";
        case "macos":
        case "linux":
            return "unix";
        default:
            return "unix";
    }
}

/**
 * Format path for logging (platform aware)
 */
export function formatPathForDisplay(path: string, p?: Platform): string {
    const targetPlatform = p || detectPlatform();

    switch (targetPlatform) {
        case "windows":
            // Convert to Windows path format
            return path.replace(/\//g, "\\");
        case "macos":
        case "linux":
        default:
            // Use Unix paths
            return path.replace(/\\/g, "/");
    }
}

/**
 * Get default daemon command for platform
 */
export function getDaemonCommand(p?: Platform): string {
    const targetPlatform = p || detectPlatform();

    switch (targetPlatform) {
        case "windows":
            return "mcp-daemon.exe";
        case "macos":
        case "linux":
            return "mcp-daemon";
        default:
            return "mcp-daemon";
    }
}

/**
 * Check platform requirements
 */
export async function checkPlatformRequirements(p?: Platform): Promise<{
    supported: boolean;
    requirements: string[];
    warnings: string[];
}> {
    const targetPlatform = p || detectPlatform();

    const result = {
        supported: true,
        requirements: [] as string[],
        warnings: [] as string[],
    };

    switch (targetPlatform) {
        case "windows":
            result.requirements.push("Windows 10 or later");
            result.requirements.push("Task Scheduler access");
            result.warnings.push("Run as administrator for Task Scheduler integration");
            break;

        case "macos":
            result.requirements.push("macOS 10.13 or later");
            result.requirements.push("LaunchAgent support");
            result.warnings.push("M1/M2 Macs require native ARM64 binary");
            break;

        case "linux":
            result.requirements.push("systemd user services support");
            result.warnings.push("Some restrictive systems may not support user services");
            break;

        default:
            result.supported = false;
            result.requirements.push(`Platform ${targetPlatform} is not supported`);
    }

    return result;
}

/**
 * Get platform info for display/debugging
 */
export function getPlatformInfo(): {
    platform: Platform;
    platformName: string;
    socketType: "unix" | "named-pipe";
    supportsAutoStart: boolean;
    supportsNativeLogging: boolean;
    command: string;
} {
    const p = detectPlatform();

    return {
        platform: p,
        platformName: getPlatformName(p),
        socketType: getSocketType(p),
        supportsAutoStart: supportsAutoStart(p),
        supportsNativeLogging: supportsNativeLogging(p),
        command: getDaemonCommand(p),
    };
}
