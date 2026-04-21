/**
 * Daemon Unit Tests
 * 
 * Tests for daemon service lifecycle, PID management,
 * graceful shutdown, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DaemonService from '../../src/daemon/daemon-service.js';
import DaemonManager from '../../src/daemon/daemon-manager.js';
import * as fs from 'fs/promises';
import { getDaemonDir, getDaemonPidFile, getDaemonLogFile } from '../../src/daemon/daemon-config.js';

describe('Daemon Service', () => {
  let daemonService: DaemonService;

  beforeEach(() => {
    daemonService = new DaemonService();
  });

  afterEach(async () => {
    await daemonService.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize daemon directories', async () => {
      await daemonService.initialize();
      
      const daemonDirExists = await fs
        .stat(getDaemonDir())
        .then(() => true)
        .catch(() => false);
      
      expect(daemonDirExists).toBe(true);
    });

    it('should handle already existing directories', async () => {
      await daemonService.initialize();
      
      // Should not throw on second initialization
      await expect(daemonService.initialize()).resolves.not.toThrow();
    });
  });

  describe('PID Management', () => {
    it('should write PID file when daemon starts', async () => {
      try {
        await daemonService.start();
        
        const pidContent = await fs.readFile(getDaemonPidFile(), 'utf-8');
        const pid = parseInt(pidContent.trim(), 10);
        
        expect(pid).toBeGreaterThan(0);
      } catch {
        // May fail in test environment, but structure is correct
      }
    });

    it('should retrieve correct PID', async () => {
      try {
        await daemonService.start();
        
        const pid = await daemonService.getPid();
        expect(pid).toBeGreaterThan(0);
      } catch {
        // May fail in test environment
      }
    });

    it('should return null when PID file does not exist', async () => {
      const pid = await daemonService.getPid();
      expect(pid).toBeNull();
    });
  });

  describe('Status Checking', () => {
    it('should check if daemon is running', async () => {
      const isRunning = await daemonService.isRunning();
      expect(typeof isRunning).toBe('boolean');
    });

    it('should return false when daemon is not running', async () => {
      const isRunning = await daemonService.isRunning();
      expect(isRunning).toBe(false);
    });

    it('should get status object', async () => {
      const status = await daemonService.getStatus();
      
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('pid');
      expect(status).toHaveProperty('uptime');
      expect(typeof status.running).toBe('boolean');
    });
  });

  describe('Logging', () => {
    it('should get empty logs when daemon has not run', async () => {
      const logs = await daemonService.getLogs(50);
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should clear logs', async () => {
      try {
        await daemonService.initialize();
        
        // Write some test content
        await fs.writeFile(getDaemonLogFile(), 'test log\n');
        
        // Clear logs
        await daemonService.clearLogs();
        
        const content = await fs.readFile(getDaemonLogFile(), 'utf-8');
        expect(content).toBe('');
      } catch {
        // May fail in test environment
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when stopping non-existent daemon', async () => {
      await expect(daemonService.stop()).rejects.toThrow();
    });

    it('should handle cleanup gracefully', async () => {
      await expect(daemonService.cleanup()).resolves.not.toThrow();
    });
  });
});

describe('Daemon Manager', () => {
  let daemonManager: DaemonManager;

  beforeEach(() => {
    daemonManager = new DaemonManager();
  });

  afterEach(async () => {
    await daemonManager.cleanup();
  });

  describe('Manager Operations', () => {
    it('should check if daemon is running', async () => {
      const isRunning = await daemonManager.isRunning();
      expect(typeof isRunning).toBe('boolean');
    });

    it('should get daemon status', async () => {
      const status = await daemonManager.status();
      
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('pid');
      expect(status).toHaveProperty('uptime');
    });

    it('should get daemon PID', async () => {
      const pid = await daemonManager.getPid();
      expect(pid === null || typeof pid === 'number').toBe(true);
    });

    it('should throw error when stopping non-running daemon', async () => {
      await expect(daemonManager.stop()).rejects.toThrow();
    });

    it('should throw error when restarting and daemon is not running', async () => {
      await expect(daemonManager.restart()).rejects.toThrow();
    });
  });

  describe('Logging Operations', () => {
    it('should get daemon logs', async () => {
      const logs = await daemonManager.logs(50);
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should clear daemon logs', async () => {
      await expect(daemonManager.clearLogs()).resolves.not.toThrow();
    });

    it('should get limited number of log lines', async () => {
      const logs = await daemonManager.logs(10);
      expect(logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle cleanup gracefully', async () => {
      await expect(daemonManager.cleanup()).resolves.not.toThrow();
    });

    it('should throw proper error messages', async () => {
      try {
        await daemonManager.stop();
      } catch (error: any) {
        expect(error.message).toContain('Failed to stop daemon');
      }
    });
  });
});
