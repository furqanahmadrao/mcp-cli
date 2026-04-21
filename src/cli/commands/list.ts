/**
 * mcpcli list command
 */

import type { Command } from "commander";
import { loadConfigWithProfile } from "../../config/loader.js";
import { handleDiscovery } from "../handlers/discovery.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON, log } from "../../output/formatters.js";
import { ConfigError } from "../../errors/custom-errors.js";

export function createListCommand(program: Command): void {
    program
        .command("list")
        .description("List all available tools from configured MCP servers")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .option(
            "-c, --compact",
            "Compact mode - omit tool input schemas to save space"
        )
        .action(async (options: { profile?: string, compact?: boolean }) => {
            try {
                log("Loading configuration...");

                const { config, selectedServers } = loadConfigWithProfile(
                    options.profile
                );

                log(
                    `Using ${selectedServers.length} server(s): ${selectedServers.join(", ")}`
                );

                const result = await handleDiscovery(config, selectedServers, {
                    compact: options.compact
                });
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
