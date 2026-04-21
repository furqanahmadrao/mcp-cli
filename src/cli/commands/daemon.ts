/**
 * Daemon CLI Command
 * 
 * Defines the `mcp daemon` CLI command and subcommands
 * for starting, stopping, restarting, and managing the daemon.
 */

import { Command } from 'commander';
import { handleDaemonCommand } from '../handlers/daemon.js';

/**
 * Create daemon command
 */
export function createDaemonCommand(program: Command): void {
  const daemon = program
    .command('daemon')
    .description('Manage MCP CLI daemon service')
    .alias('d');

  // Start subcommand
  daemon
    .command('start')
    .description('Start the daemon service')
    .option('--no-wait', 'Do not wait for daemon to start')
    .action(async (options) => {
      await handleDaemonCommand('start', options);
    });

  // Stop subcommand
  daemon
    .command('stop')
    .description('Stop the daemon service')
    .option('--force', 'Force stop (SIGKILL)')
    .action(async (options) => {
      await handleDaemonCommand('stop', options);
    });

  // Restart subcommand
  daemon
    .command('restart')
    .description('Restart the daemon service')
    .action(async (options) => {
      await handleDaemonCommand('restart', options);
    });

  // Status subcommand
  daemon
    .command('status')
    .description('Check daemon status')
    .option('--verbose', 'Show detailed status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await handleDaemonCommand('status', options);
    });

  // Logs subcommand
  daemon
    .command('logs')
    .description('View daemon logs')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .option('--follow', 'Follow log output (tail -f)')
    .option('--clear', 'Clear logs')
    .action(async (options) => {
      await handleDaemonCommand('logs', options);
    });
}

/**
 * Command types for type safety
 */
export interface DaemonCommandOptions {
  start: {
    noWait?: boolean;
  };
  stop: {
    force?: boolean;
  };
  restart: Record<string, any>;
  status: {
    verbose?: boolean;
    json?: boolean;
  };
  logs: {
    lines?: string;
    follow?: boolean;
    clear?: boolean;
  };
}

export default createDaemonCommand;
