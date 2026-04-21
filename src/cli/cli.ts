#!/usr/bin/env node

/**
 * mcpcli - MCP Gateway CLI Client
 * Main entry point
 */

import { Command } from "commander";
import { setVerboseMode } from "../output/formatters.js";
import { createListCommand } from "./commands/list.js";
import { createCallCommand } from "./commands/call.js";
import { createInfoCommand } from "./commands/info.js";
import { createTUICommand } from "./commands/tui.js";
import { createHealthCommand } from "./commands/health.js";
import { createDaemonCommand } from "./commands/daemon.js";
import { createResourceCommands } from "./commands/resources.js";
import { createPromptCommands } from "./commands/prompts.js";
import { formatError } from "../errors/error-formatter.js";
import { outputJSON } from "../output/formatters.js";

const VERSION = "0.1.0";

async function main(): Promise<void> {
    const program = new Command();

    program
        .name("mcp")
        .description("Lightweight MCP CLI gateway - execute tools without Docker or SDKs")
        .version(VERSION)
        .option("-v, --verbose", "Enable verbose logging to stderr");

    // Register commands
    createListCommand(program);
    createCallCommand(program);
    createInfoCommand(program);
    createHealthCommand(program);
    createDaemonCommand(program);
    createResourceCommands(program);
    createPromptCommands(program);
    program.addCommand(createTUICommand());

    // Default: launch TUI if no command provided
    if (process.argv.length === 2 || (process.argv.length === 3 && (process.argv[2] === '-v' || process.argv[2] === '--verbose'))) {
        // Launch interactive TUI by default
        process.argv.push("tui");
    }

    try {
        // Parse and check for verbose flag
        const opts = program.parse(process.argv);
        if (opts.opts().verbose) {
            setVerboseMode(true);
        }

        await program.parseAsync(process.argv);
    } catch (error) {
        outputJSON(formatError(error));
        process.exit(1);
    }
}

main().catch((error) => {
    outputJSON(formatError(error));
    process.exit(1);
});
