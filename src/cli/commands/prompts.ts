/**
 * mcp prompts commands
 */

import type { Command } from "commander";
import { loadConfigWithProfile } from "../../config/loader.js";
import { handlePromptDiscovery, handleGetPrompt } from "../handlers/discovery-prompts.js";
import { formatError } from "../../errors/error-formatter.js";
import { outputJSON, log } from "../../output/formatters.js";
import { ConfigError } from "../../errors/custom-errors.js";

export function createPromptCommands(program: Command): void {
    const prompts = program
        .command("prompt")
        .description("Manage and use MCP prompt templates")
        .alias("pr");

    // List subcommand
    prompts
        .command("list")
        .description("List all available prompts from configured MCP servers")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .action(async (options: { profile?: string }) => {
            try {
                log("Loading configuration...");
                const { config, selectedServers } = loadConfigWithProfile(options.profile);
                const result = await handlePromptDiscovery(config, selectedServers);
                outputJSON(result);
            } catch (error) {
                outputJSON(formatError(error));
                process.exit(1);
            }
        });

    // Get subcommand
    prompts
        .command("get <name> [args...]")
        .description("Retrieve a specific prompt by name or server.name")
        .option(
            "-p, --profile <name>",
            "Use a specific profile (default: all servers)"
        )
        .action(async (name: string, args: string[], options: { profile?: string }) => {
            try {
                log("Loading configuration...");
                const { config, selectedServers } = loadConfigWithProfile(options.profile);

                // Convert [args...] (key=value) to Record
                const promptArgs: Record<string, string> = {};
                for (const arg of args) {
                    const [key, value] = arg.split("=");
                    if (key && value) {
                        promptArgs[key] = value;
                    }
                }

                const result = await handleGetPrompt(config, selectedServers, name, promptArgs);
                outputJSON(result);
            } catch (error) {
                outputJSON(formatError(error));
                process.exit(1);
            }
        });
}
