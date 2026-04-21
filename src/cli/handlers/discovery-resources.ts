/**
 * Resource discovery handler
 */

import type { McpConfig, ResourceInfo, NamespacedResourceInfo } from "../../config/types.js";
import { GatewayCoordinator } from "../../gateway/coordinator.js";
import { ResourceRegistry } from "../../gateway/resource-registry.js";
import { log, logInfo, logWarn } from "../../output/formatters.js";

export interface ResourceDiscoveryResult {
    success: boolean;
    servers?: Record<string, { status: string; resources: ResourceInfo[] }>;
    aggregated?: {
        total: number;
        resources: NamespacedResourceInfo[];
    };
    error?: string;
}

export async function handleResourceDiscovery(
    config: McpConfig,
    selectedServerNames: string[]
): Promise<ResourceDiscoveryResult> {
    log(`Starting resource discovery for servers: ${selectedServerNames.join(", ")}`);

    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    const registry = new ResourceRegistry();

    try {
        const discoveryResults = await coordinator.discoverResources(selectedServers);

        const servers: Record<string, { status: string; resources: ResourceInfo[] }> = {};
        let totalResources = 0;
        let successCount = 0;

        for (const [serverName, result] of discoveryResults.entries()) {
            if ("resources" in result) {
                servers[serverName] = {
                    status: "connected",
                    resources: result.resources,
                };
                registry.registerResources(serverName, result.resources);
                totalResources += result.resources.length;
                successCount++;
                logInfo(`Server "${serverName}": ${result.resources.length} resources`);
            } else if ("error" in result) {
                servers[serverName] = {
                    status: "error",
                    resources: [],
                };
                logWarn(`Server "${serverName}": ERROR - ${result.error.message}`);
            }
        }

        return {
            success: successCount > 0,
            servers,
            aggregated: {
                total: totalResources,
                resources: registry.getAllResourcesFlat(),
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
 * Handle reading a resource
 */
export async function handleReadResource(
    config: McpConfig,
    selectedServerNames: string[],
    uriQuery: string
): Promise<{ success: boolean; contents?: unknown; error?: string }> {
    log(`Reading resource: ${uriQuery}`);

    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);
    coordinator.initializeRegistry(selectedServers);
    const registry = new ResourceRegistry();

    try {
        // Must discover first to find which server has the resource
        const discoveryResults = await coordinator.discoverResources(selectedServers);
        for (const [serverName, result] of discoveryResults.entries()) {
            if ("resources" in result) {
                registry.registerResources(serverName, result.resources);
            }
        }

        const resolution = registry.resolveResource(uriQuery);
        const server = selectedServers.find(s => s.name === resolution.server);
        
        if (!server) throw new Error(`Server ${resolution.server} not found`);

        const contents = await coordinator.readResource(server, resolution.uri);
        return {
            success: true,
            contents,
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
