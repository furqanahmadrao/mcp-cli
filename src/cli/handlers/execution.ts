/**
 * Tool execution handler
 * 
 * Integrates with ServerRegistry for metrics tracking
 */

import type { McpConfig, ToolExecutionResult } from "../../config/types.js";
import { GatewayCoordinator } from "../../gateway/coordinator.js";
import { ToolRegistry } from "../../gateway/tool-registry.js";
import {
    InvalidInputError,
    ToolNotFoundError,
    ExecutionError,
} from "../../errors/custom-errors.js";
import { formatError } from "../../errors/error-formatter.js";
import { log, logInfo, logError } from "../../output/formatters.js";

export async function handleExecution(
    config: McpConfig,
    selectedServerNames: string[],
    toolQuery: string,
    toolInput: unknown
): Promise<ToolExecutionResult> {
    log(
        `Starting tool execution: ${toolQuery} on servers: ${selectedServerNames.join(", ")}`
    );

    // Get selected servers
    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    if (selectedServers.length === 0) {
        return formatError(
            new ExecutionError(
                `No servers found for selection: ${selectedServerNames.join(", ")}`
            )
        );
    }

    // Create coordinator with registry initialization
    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    
    const registry = new ToolRegistry();

    try {
        // First, discover tools from all servers to build registry
        log(`Discovering tools to resolve tool query: ${toolQuery}`);

        const discoveryResults = await coordinator.discoverTools(selectedServers);

        // Register tools and check for any servers that failed
        let successCount = 0;
        for (const [serverName, result] of discoveryResults.entries()) {
            if ("tools" in result) {
                registry.registerTools(serverName, result.tools);
                successCount++;
            }
        }

        if (successCount === 0) {
            return formatError(
                new ExecutionError("Failed to connect to any servers")
            );
        }

        // Resolve the tool query
        log(`Resolving tool query: ${toolQuery}`);
        let resolvedServer: string;
        let resolvedToolName: string;

        try {
            const resolution = registry.resolveTool(toolQuery);
            resolvedServer = resolution.server;
            resolvedToolName = resolution.toolName;
            logInfo(`Resolved "${toolQuery}" to "${resolvedServer}.${resolvedToolName}"`);
        } catch (error) {
            return formatError(error);
        }

        // Get the server config
        const serverConfig = config.servers.find((s) => s.name === resolvedServer);
        if (!serverConfig) {
            return formatError(
                new ExecutionError(
                    `Server "${resolvedServer}" not found in configuration`
                )
            );
        }

        // Validate input
        if (typeof toolInput === "string") {
            try {
                (toolInput as unknown) = JSON.parse(toolInput as string);
            } catch (error) {
                return formatError(
                    new InvalidInputError(
                        `Tool input is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
                    )
                );
            }
        }

        if (toolInput !== null && typeof toolInput !== "object") {
            return formatError(
                new InvalidInputError("Tool input must be a JSON object")
            );
        }

        // Execute the tool
        log(`Executing tool "${resolvedToolName}" on server "${resolvedServer}"`);

        try {
            const result = await coordinator.executeTool(
                serverConfig,
                resolvedToolName,
                toolInput
            );

            logInfo(`Tool executed successfully`);

            return {
                success: true,
                result,
            };
        } catch (error) {
            return formatError(
                new ExecutionError(
                    error instanceof Error ? error.message : String(error),
                    { originalError: error }
                )
            );
        }
    } catch (error) {
        return formatError(error);
    } finally {
        await coordinator.closeAll();
    }
}
