/**
 * Resource registry and resolution
 * Handles resource namespacing, aggregation, and resolution
 */

import type { NamespacedResourceInfo, ResourceInfo } from "../config/types.js";

export interface ResourceLocation {
    uri: string;
    server: string;
    resource: ResourceInfo;
}

export class ResourceRegistry {
    private resources: Map<string, ResourceLocation[]> = new Map();

    /**
     * Register resources from a server
     * Handles namespacing: server.uri
     */
    registerResources(server: string, resources: ResourceInfo[]): void {
        for (const resource of resources) {
            const resourceKey = `${server}.${resource.uri}`;

            if (!this.resources.has(resourceKey)) {
                this.resources.set(resourceKey, []);
            }

            this.resources.get(resourceKey)!.push({
                uri: resource.uri,
                server,
                resource,
            });
        }
    }

    /**
     * Resolve resource by URI or namespaced lookup
     */
    resolveResource(query: string): { server: string; uri: string } {
        // If query contains dot and matches a registered resourceKey
        if (this.resources.has(query)) {
            const loc = this.resources.get(query)![0];
            return {
                server: loc.server,
                uri: loc.uri,
            };
        }

        // Search for resource across all servers by URI
        const matches: ResourceLocation[] = [];
        for (const [, locations] of this.resources.entries()) {
            for (const loc of locations) {
                if (loc.uri === query) {
                    matches.push(loc);
                }
            }
        }

        if (matches.length === 0) {
            throw new Error(`Resource "${query}" not found`);
        }

        if (matches.length > 1) {
            const servers = matches.map((m) => m.server);
            throw new Error(`Resource "${query}" is ambiguous. Found on servers: ${servers.join(", ")}. Use "server.uri" to disambiguate.`);
        }

        return {
            server: matches[0].server,
            uri: matches[0].uri,
        };
    }

    /**
     * Get all resources as flat array
     */
    getAllResourcesFlat(): NamespacedResourceInfo[] {
        const resources: NamespacedResourceInfo[] = [];

        for (const [, locations] of this.resources.entries()) {
            for (const location of locations) {
                resources.push({
                    uri: location.resource.uri,
                    name: location.resource.name,
                    server: location.server,
                    description: location.resource.description,
                    mimeType: location.resource.mimeType,
                });
            }
        }

        return resources;
    }

    clear(): void {
        this.resources.clear();
    }
}
