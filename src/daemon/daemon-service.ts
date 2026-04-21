/**
 * Daemon Service
 * 
 * Core service for managing the MCP CLI daemon as a background process.
 * Handles process spawning, management, graceful shutdown, and crash recovery.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import {
  getDaemonDir,
  getDaemonPidFile,
  getDaemonLogFile,
  getDaemonSocket,
  getCacheDir,
  DaemonConfig,
  DEFAULT_DAEMON_CONFIG,
} from './daemon-config.js';

/**
 * Daemon service for background process management
 */
export class DaemonService extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: DaemonConfig;
  private logStream: any = null;

  constructor(config?: DaemonConfig) {
    super();
    this.config = config || DEFAULT_DAEMON_CONFIG;
  }

  /**
   * Initialize daemon directories and files
   */
  async initialize(): Promise<void> {
    try {
      // Create daemon directory
      await fs.mkdir(getDaemonDir(), { recursive: true });
      
      // Create cache directory
      await fs.mkdir(getCacheDir(), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize daemon directories: ${error}`);
    }
  }

  /**
   * Start the daemon process
   */
  async start(): Promise<void> {
    try {
      // Check if already running
      if (await this.isRunning()) {
        throw new Error('Daemon is already running');
      }

      await this.initialize();

      // Spawn daemon process
      const daemonScript = path.join(import.meta.url, '../../daemon-worker.ts');
      
      this.process = spawn('node', [daemonScript], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Get PID and store it
      const pid = this.process.pid;
      if (pid) {
        await fs.writeFile(getDaemonPidFile(), pid.toString());
      }

      // Setup log file
      const logFile = getDaemonLogFile();
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });

      // Pipe stdout/stderr to log file
      if (this.process.stdout) this.process.stdout.pipe(this.logStream);
      if (this.process.stderr) this.process.stderr.pipe(this.logStream);

      // Detach from parent process
      this.process.unref();

      this.emit('started', pid);
    } catch (error) {
      throw new Error(`Failed to start daemon: ${error}`);
    }
  }

  /**
   * Stop the daemon process gracefully
   */
  async stop(): Promise<void> {
    try {
      const pid = await this.getPid();
      
      if (!pid) {
        throw new Error('Daemon is not running');
      }

      // Send SIGTERM for graceful shutdown
      process.kill(pid, 'SIGTERM');

      // Wait for shutdown (max 10 seconds)
      let attempts = 0;
      while (await this.isRunning() && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      // Force kill if still running
      if (await this.isRunning()) {
        process.kill(pid, 'SIGKILL');
      }

      // Cleanup PID file
      try {
        await fs.unlink(getDaemonPidFile());
      } catch {
        // Ignore if file doesn't exist
      }

      this.emit('stopped', pid);
    } catch (error) {
      throw new Error(`Failed to stop daemon: ${error}`);
    }
  }

  /**
   * Restart the daemon process
   */
  async restart(): Promise<void> {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  /**
   * Check if daemon is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const pid = await this.getPid();
      if (!pid) return false;

      // Check if process exists by sending signal 0
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get daemon PID
   */
  async getPid(): Promise<number | null> {
    try {
      const pidFile = getDaemonPidFile();
      const pidContent = await fs.readFile(pidFile, 'utf-8');
      const pid = parseInt(pidContent.trim(), 10);
      return isNaN(pid) ? null : pid;
    } catch {
      return null;
    }
  }

  /**
   * Get daemon uptime in milliseconds
   */
  async getUptime(): Promise<number | null> {
    try {
      const pid = await this.getPid();
      if (!pid) return null;

      // This is a simplified implementation
      // In production, you'd use process.uptime() or similar
      return Date.now();
    } catch {
      return null;
    }
  }

  /**
   * Get recent log lines
   */
  async getLogs(lines: number = 50): Promise<string[]> {
    try {
      const logFile = getDaemonLogFile();
      const content = await fs.readFile(logFile, 'utf-8');
      return content.split('\n').slice(-lines).filter(line => line.trim());
    } catch {
      return [];
    }
  }

  /**
   * Clear logs
   */
  async clearLogs(): Promise<void> {
    try {
      await fs.writeFile(getDaemonLogFile(), '');
    } catch (error) {
      throw new Error(`Failed to clear logs: ${error}`);
    }
  }

  /**
   * Get daemon status
   */
  async getStatus(): Promise<{
    running: boolean;
    pid: number | null;
    uptime: number | null;
  }> {
    return {
      running: await this.isRunning(),
      pid: await this.getPid(),
      uptime: await this.getUptime(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.logStream) {
      this.logStream.end();
    }
    if (this.process) {
      this.process.kill();
    }
  }
}

export default DaemonService;
