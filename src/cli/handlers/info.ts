/**
 * Tool information handler
 */

import type { McpConfig, ToolInfo } from "../../config/types.js";
import { GatewayCoordinator } from "../../gateway/coordinator.js";
import { ToolRegistry } from "../../gateway/tool-registry.js";
import { log, logInfo } from "../../output/formatters.js";

/**
 * Get detailed information about a specific tool
 */
export async function handleInfo(
    config: McpConfig,
    selectedServerNames: string[],
    toolQuery: string
): Promise<{ success: boolean; tool?: ToolInfo & { server: string }; error?: string }> {
    log(`Getting info for tool: ${toolQuery}`);

    // Get selected servers
    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    if (selectedServers.length === 0) {
        return {
            success: false,
            error: `No servers found for selection: ${selectedServerNames.join(", ")}`,
        };
    }

    // Create coordinator
    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    const registry = new ToolRegistry();

    try {
        // Discovery is needed to find which server has the tool
        const discoveryResults = await coordinator.discoverTools(selectedServers);

        for (const [serverName, result] of discoveryResults.entries()) {
            if ("tools" in result) {
                registry.registerTools(serverName, result.tools);
            }
        }

        // Resolve tool
        const resolution = registry.resolveTool(toolQuery);
        logInfo(`Resolved "${toolQuery}" to server "${resolution.server}"`);

        // Find the tool in the registry (with full schema)
        const allTools = registry.getAllToolsFlat();
        const tool = allTools.find(t => t.server === resolution.server && t.name === resolution.toolName);

        if (!tool) {
            return {
                success: false,
                error: `Tool "${toolQuery}" not found after resolution`,
            };
        }

        return {
            success: true,
            tool,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    } finally {
        await coordinator.closeAll();
    }
}
