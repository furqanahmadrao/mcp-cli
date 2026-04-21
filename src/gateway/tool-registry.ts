/**
 * Tool registry and resolution
 * Handles tool namespacing, aggregation, and resolution
 */

import { AmbiguousToolError } from "../errors/custom-errors.js";
import type { NamespacedToolInfo, ToolInfo } from "../config/types.js";

export interface ToolLocation {
    toolName: string;
    server: string;
    tool: ToolInfo;
}

export class ToolRegistry {
    private tools: Map<string, ToolLocation[]> = new Map();

    /**
     * Register tools from a server
     * Handles namespacing: server.tool_name
     */
    registerTools(server: string, tools: ToolInfo[]): void {
        for (const tool of tools) {
            const toolKey = `${server}.${tool.name}`;

            if (!this.tools.has(toolKey)) {
                this.tools.set(toolKey, []);
            }

            this.tools.get(toolKey)!.push({
                toolName: tool.name,
                server,
                tool,
            });
        }
    }

    /**
     * Get namespaced tool for display
     */
    getNamespacedTool(
        toolKey: string
    ): (NamespacedToolInfo & { server: string }) | undefined {
        const locations = this.tools.get(toolKey);
        if (!locations || locations.length === 0) return undefined;

        // Return the first one (in discovery scenario, should be only one per namespace)
        const location = locations[0];
        return {
            name: `${location.server}.${location.tool.name}`,
            server: location.server,
            description: location.tool.description,
            inputSchema: location.tool.inputSchema,
        };
    }

    /**
     * Resolve tool by name or namespaced lookup
     * Input formats:
     *  - "tool_name" -> auto-search across all servers
     *  - "server.tool_name" -> explicit server
     * Throws if ambiguous or not found
     */
    resolveTool(query: string): { server: string; toolName: string } {
        // If query contains dot, treat as explicit server.tool
        if (query.includes(".")) {
            const toolLoc = this.tools.get(query);
            if (!toolLoc || toolLoc.length === 0) {
                // Tool key doesn't exist as namespaced, maybe it's just a tool name with dots
                // For now, we require it to match exactly
                throw new Error(`Tool "${query}" not found`);
            }
            return {
                server: toolLoc[0].server,
                toolName: toolLoc[0].toolName,
            };
        }

        // Search for tool across all servers
        const matches: string[] = [];
        for (const [key, locations] of this.tools.entries()) {
            const parts = key.split(".");
            const baseName = parts.slice(1).join("."); // Everything after server name

            if (baseName === query || key === query) {
                matches.push(key);
            }
        }

        if (matches.length === 0) {
            throw new Error(`Tool "${query}" not found`);
        }

        if (matches.length > 1) {
            // Extract server names from matches
            const servers = matches.map((m) => m.split(".")[0]);
            throw new AmbiguousToolError(query, servers);
        }

        // Exactly one match
        const toolLoc = this.tools.get(matches[0])![0];
        return {
            server: toolLoc.server,
            toolName: toolLoc.toolName,
        };
    }

    /**
     * Get all tools organized by server
     */
    getAllTools(): Map<string, NamespacedToolInfo[]> {
        const result = new Map<string, NamespacedToolInfo[]>();

        for (const [, locations] of this.tools.entries()) {
            for (const location of locations) {
                if (!result.has(location.server)) {
                    result.set(location.server, []);
                }
                result.get(location.server)!.push({
                    name: `${location.server}.${location.tool.name}`,
                    server: location.server,
                    description: location.tool.description,
                    inputSchema: location.tool.inputSchema,
                });
            }
        }

        return result;
    }

    /**
     * Get all tools as flat array (for aggregated view)
     */
    getAllToolsFlat(): NamespacedToolInfo[] {
        const tools: NamespacedToolInfo[] = [];

        for (const [, locations] of this.tools.entries()) {
            for (const location of locations) {
                tools.push({
                    name: `${location.server}.${location.tool.name}`,
                    server: location.server,
                    description: location.tool.description,
                    inputSchema: location.tool.inputSchema,
                });
            }
        }

        return tools;
    }

    clear(): void {
        this.tools.clear();
    }
}
