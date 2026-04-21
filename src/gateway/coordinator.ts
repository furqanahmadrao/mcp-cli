/**
 * Gateway coordinator
 * Manages MCP client connections and tool discovery
 * 
 * Integrated with ServerRegistry (Pattern 1) for:
 * - Server lifecycle tracking
 * - Health status monitoring
 * - Metrics collection
 * - Error aggregation
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { spawn } from "child_process";
import type { ServerConfig, ToolInfo, ResourceInfo, PromptInfo } from "../config/types.js";
import { ConnectionError, ToolNotFoundError } from "../errors/custom-errors.js";
import { log, logInfo, logWarn, logError } from "../output/formatters.js";
import { ServerRegistry } from "./server-registry.js";

interface ClientConnection {
    client: Client;
    transport: Transport;
    process?: NodeJS.Process;
}

export class GatewayCoordinator {
    private connections: Map<string, ClientConnection> = new Map();
    private timeout: number;
    private registry: ServerRegistry;

    constructor(timeout: number = 30000, registry?: ServerRegistry) {
        this.timeout = timeout;
        this.registry = registry || new ServerRegistry();
    }

    /**
     * Initialize the registry with servers
     */
    public initializeRegistry(servers: ServerConfig[]): void {
        for (const server of servers) {
            this.registry.register(server.name, server);
        }
        logInfo(`Registry initialized with ${servers.length} servers`);
    }

    /**
     * Get the registry instance
     */
    public getRegistry(): ServerRegistry {
        return this.registry;
    }

    /**
     * Create an MCP client for a server
     */
    private async createClientForServer(
        server: ServerConfig
    ): Promise<ClientConnection> {
        const startTime = Date.now();
        this.registry.recordConnectionAttempt(server.name);

        try {
            if (server.type === "stdio") {
                if (!server.command) {
                    throw new Error(`Server "${server.name}" has no command specified`);
                }

                log(`Creating stdio transport for server "${server.name}"`);

                // Robust command parsing that handles spaces and quotes
                const commandMatch = server.command.match(/(?:[^\s"]+|"[^"]*")+/g);
                if (!commandMatch || commandMatch.length === 0) {
                    throw new Error(`Failed to parse command for server "${server.name}"`);
                }

                const command = commandMatch[0].replace(/^"|"$/g, '');
                const defaultArgs = commandMatch.slice(1).map(arg => arg.replace(/^"|"$/g, ''));
                const args = [...defaultArgs, ...(server.args || [])];

                log(`Spawning server "${server.name}": ${command} ${args.join(" ")}`);

                // Spawn child process
                const childProcess = spawn(command, args, {
                    stdio: ["pipe", "pipe", "pipe"],
                    cwd: process.cwd(),
                    shell: process.platform === "win32",
                });

                childProcess.on("error", (err) => {
                    logError(`Process error for "${server.name}": ${err.message}`);
                });

                // Create transport
                const transport = new (require("@modelcontextprotocol/sdk/client/stdio")).StdioClientTransport({
                    stdin: childProcess.stdin,
                    stdout: childProcess.stdout,
                });

                // Create client
                const client = new Client(
                    {
                        name: `mcpcli-${server.name}`,
                        version: "0.1.0",
                    },
                    {
                        capabilities: {},
                    }
                );

                log(`Connecting client for "${server.name}"`);
                await client.connect(transport);

                logInfo(`Connected to server "${server.name}"`);

                // Track connection success
                const duration = Date.now() - startTime;
                this.registry.markConnected(server.name, 0); 
                this.registry.recordResponseTime(server.name, duration);

                return { client, transport, process: childProcess };
            } else if (server.type === "http") {
                if (!server.url) {
                    throw new Error(`Server "${server.name}" has no URL specified`);
                }

                log(`Creating SSE transport for server "${server.name}" (URL: ${server.url})`);

                const transport = new SSEClientTransport(new URL(server.url));
                const client = new Client(
                    {
                        name: `mcpcli-${server.name}`,
                        version: "0.1.0",
                    },
                    {
                        capabilities: {
                            // Gateway might eventually support roots, sampling, etc.
                        },
                    }
                );

                log(`Connecting client (SSE) for "${server.name}"`);
                await client.connect(transport);

                logInfo(`Connected to server "${server.name}" (SSE)`);

                // Track connection success
                const duration = Date.now() - startTime;
                this.registry.markConnected(server.name, 0); 
                this.registry.recordResponseTime(server.name, duration);

                return { client, transport };
            }

            throw new Error(`Unknown server type: ${server.type}`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            logError(`Failed to create client for server "${server.name}": ${message}`);
            
            // Track connection failure
            const duration = Date.now() - startTime;
            const connectionError = new ConnectionError(
                `Failed to connect to server "${server.name}": ${message}`,
                { serverName: server.name }
            );
            this.registry.markDisconnected(server.name, connectionError);
            this.registry.recordResponseTime(server.name, duration);
            
            throw connectionError;
        }
    }

    /**
     * Get or create client for a server
     */
    private async getClient(server: ServerConfig): Promise<ClientConnection> {
        if (this.connections.has(server.name)) {
            return this.connections.get(server.name)!;
        }

        const connection = await this.createClientForServer(server);
        this.connections.set(server.name, connection);
        return connection;
    }

    /**
     * Get all resources from a server
     */
    async getServerResources(server: ServerConfig): Promise<ResourceInfo[]> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Listing resources from server "${server.name}"`);

            const resources: ResourceInfo[] = [];
            let nextPageToken: string | undefined;

            // Paginate through resources
            do {
                const result = await connection.client.listResources({ cursor: nextPageToken });

                for (const resource of result.resources) {
                    resources.push({
                        uri: resource.uri,
                        name: resource.name,
                        description: resource.description,
                        mimeType: resource.mimeType,
                    });
                }

                nextPageToken = result.nextCursor;
            } while (nextPageToken);

            // Update registry with resource count and response time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            
            logInfo(`Found ${resources.length} resources on server "${server.name}"`);
            return resources;
        } catch (error) {
            logError(`Failed to list resources from server "${server.name}": ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Discover resources from all selected servers (in parallel)
     */
    async discoverResources(
        servers: ServerConfig[]
    ): Promise<Map<string, { resources: ResourceInfo[] } | { error: Error }>> {
        const results = new Map<
            string,
            { resources: ResourceInfo[] } | { error: Error }
        >();

        // Fetch from all servers in parallel
        const promises = servers.map(async (server) => {
            try {
                const resources = await this.getServerResources(server);
                results.set(server.name, { resources });
            } catch (error) {
                results.set(server.name, {
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            }
        });

        await Promise.all(promises);

        return results;
    }

    /**
     * Read a resource from a specific server
     */
    async readResource(
        server: ServerConfig,
        uri: string
    ): Promise<unknown> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Reading resource "${uri}" from server "${server.name}"`);

            const result = await connection.client.readResource({
                uri,
            });

            // Track execution time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);

            logInfo(`Resource "${uri}" read successfully from "${server.name}" (${duration}ms)`);

            return result.contents;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            
            logError(
                `Failed to read resource "${uri}": ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    /**
     * Get all prompts from a server
     */
    async getServerPrompts(server: ServerConfig): Promise<PromptInfo[]> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Listing prompts from server "${server.name}"`);

            const prompts: PromptInfo[] = [];
            let nextPageToken: string | undefined;

            // Paginate through prompts
            do {
                const result = await connection.client.listPrompts({ cursor: nextPageToken });

                for (const prompt of result.prompts) {
                    prompts.push({
                        name: prompt.name,
                        description: prompt.description,
                        arguments: prompt.arguments?.map(arg => ({
                            name: arg.name,
                            description: arg.description,
                            required: arg.required,
                        })),
                    });
                }

                nextPageToken = result.nextCursor;
            } while (nextPageToken);

            // Update registry with prompt count and response time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            
            logInfo(`Found ${prompts.length} prompts on server "${server.name}"`);
            return prompts;
        } catch (error) {
            logError(`Failed to list prompts from server "${server.name}": ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Discover prompts from all selected servers (in parallel)
     */
    async discoverPrompts(
        servers: ServerConfig[]
    ): Promise<Map<string, { prompts: PromptInfo[] } | { error: Error }>> {
        const results = new Map<
            string,
            { prompts: PromptInfo[] } | { error: Error }
        >();

        // Fetch from all servers in parallel
        const promises = servers.map(async (server) => {
            try {
                const prompts = await this.getServerPrompts(server);
                results.set(server.name, { prompts });
            } catch (error) {
                results.set(server.name, {
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            }
        });

        await Promise.all(promises);

        return results;
    }

    /**
     * Get a specific prompt template from a server
     */
    async getPrompt(
        server: ServerConfig,
        promptName: string,
        promptArgs?: Record<string, string>
    ): Promise<unknown> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Getting prompt "${promptName}" from server "${server.name}"`);

            const result = await connection.client.getPrompt({
                name: promptName,
                arguments: promptArgs,
            });

            // Track execution time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);

            logInfo(`Prompt "${promptName}" retrieved successfully from "${server.name}" (${duration}ms)`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            
            logError(
                `Failed to get prompt "${promptName}": ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    /**
     * Get all tools from a server
     */
    async getServerTools(server: ServerConfig): Promise<ToolInfo[]> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Listing tools from server "${server.name}"`);

            const tools: ToolInfo[] = [];
            let nextPageToken: string | undefined;

            // Paginate through tools
            do {
                const result = await connection.client.listTools({ cursor: nextPageToken });

                for (const tool of result.tools) {
                    tools.push({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema as Record<string, unknown>,
                    });
                }

                nextPageToken = result.nextCursor;
            } while (nextPageToken);

            // Update registry with tool count and response time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            const server_status = this.registry.get(server.name);
            if (server_status) {
                this.registry.markConnected(server.name, tools.length);
            }

            logInfo(`Found ${tools.length} tools on server "${server.name}"`);
            return tools;
        } catch (error) {
            logError(`Failed to list tools from server "${server.name}": ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Discover tools from all selected servers (in parallel)
     */
    async discoverTools(
        servers: ServerConfig[]
    ): Promise<Map<string, { tools: ToolInfo[] } | { error: Error }>> {
        const results = new Map<
            string,
            { tools: ToolInfo[] } | { error: Error }
        >();

        // Fetch from all servers in parallel
        const promises = servers.map(async (server) => {
            try {
                const tools = await this.getServerTools(server);
                results.set(server.name, { tools });
            } catch (error) {
                results.set(server.name, {
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            }
        });

        await Promise.all(promises);

        return results;
    }

    /**
     * Execute a tool on a specific server
     */
    async executeTool(
        server: ServerConfig,
        toolName: string,
        toolInput: unknown
    ): Promise<unknown> {
        const startTime = Date.now();

        try {
            const connection = await this.getClient(server);

            log(`Executing tool "${toolName}" on server "${server.name}"`);

            const result = await connection.client.callTool({
                name: toolName,
                arguments: toolInput as Record<string, unknown>,
            });

            // Track execution time
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);

            // Check if tool returned an error (isError flag)
            if (result.isError) {
                const errorContent = result.content[0];
                const errorMessage =
                    errorContent && "text" in errorContent
                        ? errorContent.text
                        : "Tool returned an error";
                throw new Error(errorMessage);
            }

            logInfo(`Tool "${toolName}" executed successfully on "${server.name}" (${duration}ms)`);

            // Extract result content
            const content = result.content[0];
            if (content && "text" in content) {
                try {
                    return JSON.parse(content.text);
                } catch {
                    return content.text;
                }
            }

            return result.content;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.registry.recordResponseTime(server.name, duration);
            
            logError(
                `Failed to execute tool "${toolName}": ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    /**
     * Close all connections and cleanup
     */
    async closeAll(): Promise<void> {
        log(`Closing ${this.connections.size} server connections`);

        const promises: Promise<void>[] = [];

        for (const [name, connection] of this.connections.entries()) {
            promises.push(
                (async () => {
                    try {
                        await connection.transport.close();

                        if (connection.process) {
                            connection.process.kill();
                            log(`Killed process for server "${name}"`);
                        }

                        logInfo(`Closed connection to server "${name}"`);
                        
                        // Mark as disconnected in registry
                        const disconnectError = new Error("Connection closed");
                        this.registry.markDisconnected(name, disconnectError);
                    } catch (error) {
                        logWarn(
                            `Error closing connection to server "${name}": ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                })()
            );
        }

        await Promise.all(promises);
        this.connections.clear();
    }

    /**
     * Get health status of all servers
     */
    getHealthStatus() {
        return this.registry.getStatus();
    }

    /**
     * Get health summary
     */
    getHealthSummary() {
        return this.registry.getHealthSummary();
    }
}
