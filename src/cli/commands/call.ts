/**
 * mcpcli call command
 */

import type { Command } from "commander";
import fs from "fs/promises";
import { loadConfigWithProfile } from "../../config/loader.js";
import { handleExecution } from "../handlers/execution.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON, log } from "../../output/formatters.js";
import { ConfigError } from "../../errors/custom-errors.js";

export function createCallCommand(program: Command): void {
    program
        .command("call <tool> [input]")
        .description("Execute a specific MCP tool")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .option(
            "-f, --file <path>",
            "Read input JSON from a file"
        )
        .option(
            "-s, --stdin",
            "Read input JSON from stdin"
        )
        .action(
            async (
                tool: string,
                input: string | undefined,
                options: { profile?: string, file?: string, stdin?: boolean }
            ) => {
                try {
                    log("Loading configuration...");

                    const { config, selectedServers } = loadConfigWithProfile(
                        options.profile
                    );

                    log(
                        `Using ${selectedServers.length} server(s): ${selectedServers.join(", ")}`
                    );

                    // Determine input source
                    let inputString: string | undefined = input;

                    if (options.stdin) {
                        log("Reading input from stdin...");
                        inputString = await readFromStdin();
                    } else if (options.file) {
                        log(`Reading input from file: ${options.file}`);
                        inputString = await fs.readFile(options.file, "utf-8");
                    }

                    // Parse input
                    let parsedInput: unknown = {};
                    if (inputString) {
                        try {
                            parsedInput = JSON.parse(inputString);
                        } catch (error) {
                            outputJSON(
                                formatError(
                                    new Error(`Invalid JSON input: ${error instanceof Error ? error.message : String(error)}`)
                                )
                            );
                            process.exit(1);
                            return;
                        }
                    }

                    log(`Executing tool: ${tool}`);
                    const result = await handleExecution(config, selectedServers, tool, parsedInput);
                    outputJSON(result);

                    if (!result.success) {
                        process.exit(1);
                    }
                } catch (error) {
                    if (error instanceof ConfigError) {
                        outputJSON(formatError(error));
                    } else {
                        outputJSON(formatError(error));
                    }
                    process.exit(1);
                }
            }
        );
}

/**
 * Helper to read from stdin
 */
async function readFromStdin(): Promise<string> {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
}
