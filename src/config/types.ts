/**
 * Configuration types for mcpcli
 */

export interface AuthConfig {
    type: "bearer" | "oauth" | "none";
}

export interface BearerAuthConfig extends AuthConfig {
    type: "bearer";
    token: string;
}

export interface OAuthConfig extends AuthConfig {
    type: "oauth";
    client_id: string;
    client_secret: string;
    token_url: string;
    scopes?: string[];
}

export interface ServerConfig {
    name: string;
    type: "stdio" | "http";
    command?: string;
    args?: string[];
    url?: string;
    auth?: BearerAuthConfig | OAuthConfig;
    timeout?: number;
}

export interface ProfileConfig {
    servers: string[];
}

export interface McpConfig {
    version: string;
    servers: ServerConfig[];
    profiles?: Record<string, ProfileConfig>;
}

export interface ToolInfo {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
}

export interface ResourceInfo {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface PromptInfo {
    name: string;
    description?: string;
    arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
    }>;
}

export interface NamespacedToolInfo extends ToolInfo {
    server: string;
}

export interface NamespacedResourceInfo extends ResourceInfo {
    server: string;
}

export interface NamespacedPromptInfo extends PromptInfo {
    server: string;
}

export interface ServerToolList {
    status: "connected" | "error";
    tools?: ToolInfo[];
    error?: {
        type: string;
        message: string;
    };
}

export interface DiscoveryResult {
    success: boolean;
    servers?: Record<string, ServerToolList>;
    aggregated?: {
        total: number;
        tools: NamespacedToolInfo[];
    };
    health?: {
        servers: {
            total: number;
            connected: number;
            failed: number;
        };
        tools: number;
    };
    meta?: {
        source?: "direct_discovery" | "daemon_cache";
        cacheAge?: number;
    };
    error?: {
        type: string;
        message: string;
    };
}

export interface ToolExecutionResult {
    success: boolean;
    result?: unknown;
    error?: {
        type: string;
        message: string;
        details?: unknown;
    };
}
