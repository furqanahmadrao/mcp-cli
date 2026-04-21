/**
 * Prompt discovery and execution handler
 */

import type { McpConfig, PromptInfo, NamespacedPromptInfo } from "../../config/types.js";
import { GatewayCoordinator } from "../../gateway/coordinator.js";
import { PromptRegistry } from "../../gateway/prompt-registry.js";
import { log, logInfo, logWarn } from "../../output/formatters.js";

export interface PromptDiscoveryResult {
    success: boolean;
    servers?: Record<string, { status: string; prompts: PromptInfo[] }>;
    aggregated?: {
        total: number;
        prompts: NamespacedPromptInfo[];
    };
    error?: string;
}

export async function handlePromptDiscovery(
    config: McpConfig,
    selectedServerNames: string[]
): Promise<PromptDiscoveryResult> {
    log(`Starting prompt discovery for servers: ${selectedServerNames.join(", ")}`);

    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    const registry = new PromptRegistry();

    try {
        const discoveryResults = await coordinator.discoverPrompts(selectedServers);

        const servers: Record<string, { status: string; prompts: PromptInfo[] }> = {};
        let totalPrompts = 0;
        let successCount = 0;

        for (const [serverName, result] of discoveryResults.entries()) {
            if ("prompts" in result) {
                servers[serverName] = {
                    status: "connected",
                    prompts: result.prompts,
                };
                registry.registerPrompts(serverName, result.prompts);
                totalPrompts += result.prompts.length;
                successCount++;
                logInfo(`Server "${serverName}": ${result.prompts.length} prompts`);
            } else if ("error" in result) {
                servers[serverName] = {
                    status: "error",
                    prompts: [],
                };
                logWarn(`Server "${serverName}": ERROR - ${result.error.message}`);
            }
        }

        return {
            success: successCount > 0,
            servers,
            aggregated: {
                total: totalPrompts,
                prompts: registry.getAllPromptsFlat(),
            },
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

/**
 * Handle getting a specific prompt
 */
export async function handleGetPrompt(
    config: McpConfig,
    selectedServerNames: string[],
    promptQuery: string,
    promptArgs?: Record<string, string>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
    log(`Getting prompt: ${promptQuery} with args: ${JSON.stringify(promptArgs)}`);

    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    const registry = new PromptRegistry();

    try {
        // Discovery is needed to find which server has the prompt
        const discoveryResults = await coordinator.discoverPrompts(selectedServers);
        for (const [serverName, result] of discoveryResults.entries()) {
            if ("prompts" in result) {
                registry.registerPrompts(serverName, result.prompts);
            }
        }

        const resolution = registry.resolvePrompt(promptQuery);
        const server = selectedServers.find(s => s.name === resolution.server);
        
        if (!server) throw new Error(`Server ${resolution.server} not found`);

        const result = await coordinator.getPrompt(server, resolution.promptName, promptArgs);
        return {
            success: true,
            result,
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
