/**
 * TUI Command - Launch interactive terminal UI
 * 
 * Optimized for snappy, flicker-free performance with reactive rendering.
 * Eliminates unnecessary dashboard features for a streamlined experience.
 */

import { Command } from "commander";
import { TUIApplication } from "../../tui/app.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON } from "../../output/formatters.js";
import { hideCursor, showCursor, moveCursor, RESET } from "../../tui/theme.js";

/**
 * Create and return the TUI command
 */
export function createTUICommand(): Command {
  const cmd = new Command("tui");
  
  cmd
    .description("Launch interactive terminal UI dashboard")
    .action(async (options) => {
      try {
        const app = new TUIApplication();
        
        // Setup terminal
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.setEncoding('utf8');
          hideCursor();
        }

        // Initialize TUI
        await app.initialize();

        const updateTerminalSize = () => {
          const width = process.stdout.columns || 80;
          const height = process.stdout.rows || 24;
          app.setTerminalSize(width, height);
        };

        updateTerminalSize();

        const render = () => {
          const output = app.getRenderedOutput();
          // Reset cursor to top-left
          moveCursor(1, 1);
          
          // Print output line by line with EOL clearance
          const lines = output.split('\n');
          const termHeight = process.stdout.rows || 24;
          
          for (let i = 0; i < termHeight; i++) {
            if (i < lines.length) {
              process.stdout.write(lines[i] + '\x1b[K');
            } else {
              process.stdout.write('\x1b[K'); // Clear remaining lines
            }
            if (i < termHeight - 1) {
              process.stdout.write('\n');
            }
          }
        };

        // Initial clear and render
        process.stdout.write('\x1b[2J'); // Full clear screen
        render();

        // Reactive input handling
        process.stdin.on('data', (key: string) => {
          if (key === '\u0003') { // Ctrl+C
            shutdown();
          } else {
            app.handleInput(key);
            if (!app.isApplicationRunning()) {
              shutdown();
            } else {
              render();
            }
          }
        });

        // Handle terminal resize
        process.stdout.on('resize', () => {
          updateTerminalSize();
          render();
        });

        function shutdown() {
          showCursor();
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          console.clear();
          process.exit(0);
        }
      } catch (error) {
        showCursor();
        outputJSON(formatError(error));
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Add TUI command to program
 */
export function addTUICommand(program: Command): void {
  program.addCommand(createTUICommand());
}
