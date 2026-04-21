/**
 * Zod schema validation for configuration
 */

import { z } from "zod";
import type { McpConfig, ServerConfig } from "./types.js";

const BearerAuthSchema = z.object({
    type: z.literal("bearer"),
    token: z.string(),
});

const OAuthAuthSchema = z.object({
    type: z.literal("oauth"),
    client_id: z.string(),
    client_secret: z.string(),
    token_url: z.string().url(),
    scopes: z.array(z.string()).optional(),
});

const AuthSchema = z.union([BearerAuthSchema, OAuthAuthSchema]);

const ServerConfigSchema = z.object({
    name: z.string().min(1),
    type: z.enum(["stdio", "http"]),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    url: z.string().url().optional(),
    auth: AuthSchema.optional(),
    timeout: z.number().positive().default(30000),
});

const ProfileConfigSchema = z.object({
    servers: z.array(z.string().min(1)),
});

const McpConfigSchema = z.object({
    version: z.string(),
    servers: z.array(ServerConfigSchema),
    profiles: z.record(ProfileConfigSchema).optional(),
});

export { McpConfigSchema, ServerConfigSchema };

export function validateConfig(config: unknown): McpConfig {
    return McpConfigSchema.parse(config);
}
