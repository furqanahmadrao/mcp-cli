/**
 * mcp info command
 */

import type { Command } from "commander";
import { loadConfigWithProfile } from "../../config/loader.js";
import { handleInfo } from "../handlers/info.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON, log } from "../../output/formatters.js";
import { ConfigError } from "../../errors/custom-errors.js";

export function createInfoCommand(program: Command): void {
    program
        .command("info <tool>")
        .description("Get detailed information and JSON schema for a specific tool")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .action(async (tool: string, options: { profile?: string }) => {
            try {
                log("Loading configuration...");

                const { config, selectedServers } = loadConfigWithProfile(
                    options.profile
                );

                log(
                    `Using ${selectedServers.length} server(s): ${selectedServers.join(", ")}`
                );

                const result = await handleInfo(config, selectedServers, tool);
                outputJSON(result);
            } catch (error) {
                if (error instanceof ConfigError) {
                    outputJSON(formatError(error));
                } else {
                    outputJSON(formatError(error));
                }
                process.exit(1);
            }
        });
}
