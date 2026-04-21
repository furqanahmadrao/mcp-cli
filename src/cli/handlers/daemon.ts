/**
 * Daemon Handler
 * 
 * Processes daemon CLI commands and produces formatted output.
 * Handles start, stop, status, logs operations.
 */

import DaemonManager from '../../daemon/daemon-manager.js';
import { DaemonCommandOptions } from '../commands/daemon.js';

/**
 * Handle daemon start command
 */
export async function handleDaemonStart(options: DaemonCommandOptions['start']): Promise<void> {
  const manager = new DaemonManager();

  try {
    const isRunning = await manager.isRunning();
    
    if (isRunning) {
      console.log('✓ Daemon is already running');
      return;
    }

    console.log('Starting daemon...');
    const pid = await manager.start();
    
    console.log(`✓ Daemon started (PID: ${pid})`);
    console.log(`✓ Health polling every 30s`);
    console.log(`✓ Tool discovery every 5m`);
    console.log(`✓ Logs: ~/.mcp/daemon/daemon.log`);
  } catch (error) {
    console.error(`✗ Failed to start daemon: ${error}`);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

/**
 * Handle daemon stop command
 */
export async function handleDaemonStop(options: DaemonCommandOptions['stop']): Promise<void> {
  const manager = new DaemonManager();

  try {
    const isRunning = await manager.isRunning();
    
    if (!isRunning) {
      console.log('ℹ Daemon is not running');
      return;
    }

    console.log('Stopping daemon...');
    const pid = await manager.stop();
    
    console.log(`✓ Daemon stopped (was PID: ${pid})`);
  } catch (error) {
    console.error(`✗ Failed to stop daemon: ${error}`);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

/**
 * Handle daemon restart command
 */
export async function handleDaemonRestart(options: DaemonCommandOptions['restart']): Promise<void> {
  const manager = new DaemonManager();

  try {
    console.log('Restarting daemon...');
    const pid = await manager.restart();
    
    console.log(`✓ Daemon restarted (PID: ${pid})`);
  } catch (error) {
    console.error(`✗ Failed to restart daemon: ${error}`);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

/**
 * Handle daemon status command
 */
export async function handleDaemonStatus(options: DaemonCommandOptions['status']): Promise<void> {
  const manager = new DaemonManager();

  try {
    const status = await manager.status();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log('\n╔════════════════════════════════════╗');
      console.log('║      DAEMON STATUS                 ║');
      console.log('╠════════════════════════════════════╣');
      
      if (status.running) {
        console.log(`║ Status:        ✅ Running         ║`);
      } else {
        console.log(`║ Status:        ❌ Not running     ║`);
      }
      
      if (status.pid) {
        console.log(`║ PID:           ${status.pid}${' '.repeat(28 - status.pid.toString().length)}║`);
      }
      
      console.log('╚════════════════════════════════════╝\n');
    }
  } catch (error) {
    console.error(`✗ Failed to get daemon status: ${error}`);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

/**
 * Handle daemon logs command
 */
export async function handleDaemonLogs(options: DaemonCommandOptions['logs']): Promise<void> {
  const manager = new DaemonManager();

  try {
    if (options.clear) {
      console.log('Clearing daemon logs...');
      await manager.clearLogs();
      console.log('✓ Daemon logs cleared');
      return;
    }

    const lines = parseInt(options.lines || '50', 10);
    const logs = await manager.logs(Math.min(lines, 1000));

    if (logs.length === 0) {
      console.log('ℹ No logs available');
    } else {
      console.log(`\n╔════════════════════════════════════╗`);
      console.log(`║ DAEMON LOGS (Last ${lines} lines)${' '.repeat(22 - lines.toString().length)}║`);
      console.log(`╠════════════════════════════════════╣`);
      
      logs.forEach(line => {
        const truncated = line.length > 36 ? line.substring(0, 33) + '...' : line;
        console.log(`║ ${truncated.padEnd(36)} ║`);
      });
      
      console.log(`╚════════════════════════════════════╝\n`);
    }
  } catch (error) {
    console.error(`✗ Failed to get daemon logs: ${error}`);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

/**
 * Generic daemon handler dispatcher
 */
export async function handleDaemonCommand(
  subcommand: string,
  options: any
): Promise<void> {
  switch (subcommand) {
    case 'start':
      await handleDaemonStart(options);
      break;
    case 'stop':
      await handleDaemonStop(options);
      break;
    case 'restart':
      await handleDaemonRestart(options);
      break;
    case 'status':
      await handleDaemonStatus(options);
      break;
    case 'logs':
      await handleDaemonLogs(options);
      break;
    default:
      console.error(`Unknown daemon subcommand: ${subcommand}`);
      process.exit(1);
  }
}

export default handleDaemonCommand;
