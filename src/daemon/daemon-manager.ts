/**
 * Daemon Manager
 * 
 * High-level daemon process management.
 * Provides methods to start, stop, restart, and monitor daemon.
 */

import DaemonService from './daemon-service.js';
import { DaemonConfig, DEFAULT_DAEMON_CONFIG } from './daemon-config.js';

/**
 * Daemon manager for high-level process control
 */
export class DaemonManager {
  private service: DaemonService;

  constructor(config?: DaemonConfig) {
    this.service = new DaemonService(config);
  }

  /**
   * Start the daemon
   * Returns PID of started process
   */
  async start(): Promise<number> {
    try {
      await this.service.start();
      const pid = await this.service.getPid();
      
      if (!pid) {
        throw new Error('Failed to retrieve daemon PID');
      }

      return pid;
    } catch (error) {
      throw new Error(`Failed to start daemon: ${error}`);
    }
  }

  /**
   * Stop the daemon
   * Returns PID of stopped process
   */
  async stop(): Promise<number> {
    try {
      const pid = await this.service.getPid();
      
      if (!pid) {
        throw new Error('Daemon is not running');
      }

      await this.service.stop();
      return pid;
    } catch (error) {
      throw new Error(`Failed to stop daemon: ${error}`);
    }
  }

  /**
   * Restart the daemon
   * Returns PID of restarted process
   */
  async restart(): Promise<number> {
    try {
      await this.service.restart();
      const pid = await this.service.getPid();
      
      if (!pid) {
        throw new Error('Failed to retrieve daemon PID after restart');
      }

      return pid;
    } catch (error) {
      throw new Error(`Failed to restart daemon: ${error}`);
    }
  }

  /**
   * Check if daemon is running
   */
  async status(): Promise<{
    running: boolean;
    pid: number | null;
    uptime: number | null;
  }> {
    try {
      return await this.service.getStatus();
    } catch (error) {
      throw new Error(`Failed to get daemon status: ${error}`);
    }
  }

  /**
   * Get daemon logs
   */
  async logs(lines?: number): Promise<string[]> {
    try {
      return await this.service.getLogs(lines);
    } catch (error) {
      throw new Error(`Failed to retrieve daemon logs: ${error}`);
    }
  }

  /**
   * Get daemon PID
   */
  async getPid(): Promise<number | null> {
    try {
      return await this.service.getPid();
    } catch (error) {
      throw new Error(`Failed to get daemon PID: ${error}`);
    }
  }

  /**
   * Check if daemon is running
   */
  async isRunning(): Promise<boolean> {
    try {
      return await this.service.isRunning();
    } catch (error) {
      throw new Error(`Failed to check if daemon is running: ${error}`);
    }
  }

  /**
   * Clear daemon logs
   */
  async clearLogs(): Promise<void> {
    try {
      await this.service.clearLogs();
    } catch (error) {
      throw new Error(`Failed to clear daemon logs: ${error}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.service.cleanup();
  }
}

export default DaemonManager;
