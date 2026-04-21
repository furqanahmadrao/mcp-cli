/**
 * Prompt registry and resolution
 * Handles prompt namespacing, aggregation, and resolution
 */

import type { NamespacedPromptInfo, PromptInfo } from "../config/types.js";

export interface PromptLocation {
    promptName: string;
    server: string;
    prompt: PromptInfo;
}

export class PromptRegistry {
    private prompts: Map<string, PromptLocation[]> = new Map();

    /**
     * Register prompts from a server
     * Handles namespacing: server.prompt_name
     */
    registerPrompts(server: string, prompts: PromptInfo[]): void {
        for (const prompt of prompts) {
            const promptKey = `${server}.${prompt.name}`;

            if (!this.prompts.has(promptKey)) {
                this.prompts.set(promptKey, []);
            }

            this.prompts.get(promptKey)!.push({
                promptName: prompt.name,
                server,
                prompt,
            });
        }
    }

    /**
     * Resolve prompt by name or namespaced lookup
     */
    resolvePrompt(query: string): { server: string; promptName: string } {
        // If query contains dot and matches a registered promptKey
        if (this.prompts.has(query)) {
            const loc = this.prompts.get(query)![0];
            return {
                server: loc.server,
                promptName: loc.promptName,
            };
        }

        // Search for prompt across all servers by name
        const matches: PromptLocation[] = [];
        for (const [, locations] of this.prompts.entries()) {
            for (const loc of locations) {
                if (loc.promptName === query) {
                    matches.push(loc);
                }
            }
        }

        if (matches.length === 0) {
            throw new Error(`Prompt "${query}" not found`);
        }

        if (matches.length > 1) {
            const servers = matches.map((m) => m.server);
            throw new Error(`Prompt "${query}" is ambiguous. Found on servers: ${servers.join(", ")}. Use "server.prompt_name" to disambiguate.`);
        }

        return {
            server: matches[0].server,
            promptName: matches[0].promptName,
        };
    }

    /**
     * Get all prompts as flat array
     */
    getAllPromptsFlat(): NamespacedPromptInfo[] {
        const prompts: NamespacedPromptInfo[] = [];

        for (const [, locations] of this.prompts.entries()) {
            for (const location of locations) {
                prompts.push({
                    name: location.prompt.name,
                    server: location.server,
                    description: location.prompt.description,
                    arguments: location.prompt.arguments,
                });
            }
        }

        return prompts;
    }

    clear(): void {
        this.prompts.clear();
    }
}
