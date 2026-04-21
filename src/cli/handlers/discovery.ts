/**
 * Tool discovery handler
 * 
 * Integrates with ServerRegistry for health tracking and metrics collection
 * Supports optional daemon caching for faster repeated queries
 */

import type { McpConfig, DiscoveryResult, ServerToolList } from "../../config/types.js";
import { GatewayCoordinator } from "../../gateway/coordinator.js";
import { ToolRegistry } from "../../gateway/tool-registry.js";
import { log, logInfo, logWarn } from "../../output/formatters.js";
import { getDaemonClient } from "../../daemon/daemon-client.js";
import { getCacheManager } from "../../daemon/cache-manager.js";

export async function handleDiscovery(
    config: McpConfig,
    selectedServerNames: string[],
    options: { useDaemonCache?: boolean; compact?: boolean } = {}
): Promise<DiscoveryResult> {
    const useDaemonCache = options.useDaemonCache !== false;
    const compact = options.compact === true;

    log(`Starting tool discovery for servers: ${selectedServerNames.join(", ")}${compact ? " (compact mode)" : ""}`);

    // Get selected servers
    const selectedServers = config.servers.filter((s) =>
        selectedServerNames.includes(s.name)
    );

    if (selectedServers.length === 0) {
        return {
            success: false,
            error: {
                type: "config_error",
                message: `No servers found for selection: ${selectedServerNames.join(", ")}`,
            },
        };
    }

    // Attempt to get cached tools from daemon if enabled
    if (useDaemonCache) {
        try {
            const daemonClient = getDaemonClient();
            const cachedTools = await daemonClient.getCachedTools();

            if (cachedTools && (cachedTools as any).servers && (cachedTools as any).servers.includes(selectedServerNames[0])) {
                logInfo(`Using cached tools from daemon (age: ${Date.now() - (cachedTools as any).timestamp}ms)`);

                // Build response from cache
                const servers: Record<string, ServerToolList> = {};
                const registry = new ToolRegistry();

                for (const serverName of selectedServerNames) {
                    const tools = (cachedTools as any).tools[serverName] || [];
                    const filteredTools = compact
                        ? tools.map((tool: any) => {
                            const { inputSchema, ...rest } = tool;
                            return rest;
                          })
                        : tools;

                    servers[serverName] = {
                        status: "connected",
                        tools: filteredTools,
                    };
                    if (filteredTools.length > 0) {
                        registry.registerTools(serverName, filteredTools);
                    }
                }

                const totalTools = Object.values((cachedTools as any).tools).reduce(
                    (sum: number, tools: any) => sum + (Array.isArray(tools) ? tools.length : 0),
                    0
                );

                return {
                    success: true,
                    servers,
                    aggregated: {
                        total: totalTools,
                        tools: registry.getAllToolsFlat(),
                    },
                    health: {
                        servers: {
                            total: selectedServers.length,
                            connected: selectedServerNames.length,
                            failed: 0,
                        },
                        tools: totalTools,
                    },
                    meta: {
                        source: "daemon_cache",
                        cacheAge: Date.now() - (cachedTools as any).timestamp,
                    },
                };
            }
        } catch (error) {
            logWarn(`Daemon cache lookup failed, falling back to direct discovery: ${error}`);
        }
    }

    // Create coordinator with timeout from config
    const coordinator = new GatewayCoordinator(config.servers[0]?.timeout || 30000);

    // Initialize registry with all servers
    coordinator.initializeRegistry(selectedServers);

    const registry = new ToolRegistry();

    try {
        // Discover tools from all servers
        const discoveryResults = await coordinator.discoverTools(selectedServers);

        // Build response
        const servers: Record<string, ServerToolList> = {};
        let totalTools = 0;
        let successCount = 0;

        for (const [serverName, result] of discoveryResults.entries()) {
            if ("tools" in result) {
                const tools = compact
                    ? result.tools.map((tool: any) => {
                        const { inputSchema, ...rest } = tool;
                        return rest;
                      })
                    : result.tools;

                servers[serverName] = {
                    status: "connected",
                    tools,
                };
                registry.registerTools(serverName, tools);
                totalTools += tools.length;
                successCount++;
                logInfo(`Server "${serverName}": ${tools.length} tools`);
            } else if ("error" in result) {
                servers[serverName] = {
                    status: "error",
                    error: {
                        type:
                            (result.error as any).name === "ConnectionError"
                                ? "connection_error"
                                : "unknown",
                        message: (result.error as Error).message,
                    },
                };
                logWarn(`Server "${serverName}": ERROR - ${(result.error as Error).message}`);
            }
        }

        // Get health summary from coordinator's registry
        const health = coordinator.getHealthSummary();
        logInfo(`Discovery complete: ${successCount}/${selectedServers.length} servers connected, ${totalTools} tools total`);

        if (successCount === 0) {
            return {
                success: false,
                error: {
                    type: "connection_error",
                    message: "Failed to connect to any servers",
                },
            };
        }

        const result: DiscoveryResult = {
            success: true,
            servers,
            aggregated: {
                total: totalTools,
                tools: registry.getAllToolsFlat(),
            },
            health: {
                servers: {
                    total: health.totalServers,
                    connected: health.connectedServers,
                    failed: health.failedServers,
                },
                tools: health.totalTools,
            },
            meta: {
                source: "direct_discovery",
            },
        };

        // Cache discovery results if daemon is available
        if (useDaemonCache) {
            try {
                const cache = getCacheManager();
                const toolsByServer: Record<string, unknown[]> = {};

                for (const [serverName, toolList] of Object.entries(servers)) {
                    if (toolList.status === "connected" && "tools" in toolList) {
                        toolsByServer[serverName] = toolList.tools;
                    }
                }

                await cache.set(
                    "discovery_results",
                    {
                        tools: toolsByServer,
                        servers: selectedServerNames,
                        timestamp: Date.now(),
                        ttl: 5 * 60 * 1000, // 5 minute TTL
                    },
                    5 * 60 * 1000
                );

                logInfo("Discovery results cached");
            } catch (error) {
                logWarn(`Failed to cache discovery results: ${error}`);
            }
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: {
                type: "unknown",
                message: error instanceof Error ? error.message : String(error),
            },
        };
    } finally {
        await coordinator.closeAll();
    }
}

