/**
 * mcp resources commands
 */

import type { Command } from "commander";
import { loadConfigWithProfile } from "../../config/loader.js";
import { handleResourceDiscovery, handleReadResource } from "../handlers/discovery-resources.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON, log } from "../../output/formatters.js";
import { ConfigError } from "../../errors/custom-errors.js";

export function createResourceCommands(program: Command): void {
    const resources = program
        .command("resource")
        .description("Manage and read MCP resources")
        .alias("res");

    // List subcommand
    resources
        .command("list")
        .description("List all available resources from configured MCP servers")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .action(async (options: { profile?: string }) => {
            try {
                log("Loading configuration...");
                const { config, selectedServers } = loadConfigWithProfile(options.profile);
                const result = await handleResourceDiscovery(config, selectedServers);
                outputJSON(result);
            } catch (error) {
                outputJSON(formatError(error));
                process.exit(1);
            }
        });

    // Read subcommand
    resources
        .command("read <uri>")
        .description("Read a specific resource by URI or server.uri")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .action(async (uri: string, options: { profile?: string }) => {
            try {
                log("Loading configuration...");
                const { config, selectedServers } = loadConfigWithProfile(options.profile);
                const result = await handleReadResource(config, selectedServers, uri);
                outputJSON(result);
            } catch (error) {
                outputJSON(formatError(error));
                process.exit(1);
            }
        });
}
