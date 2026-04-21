/**
 * Configuration loader - reads JSON/YAML from ~/.mcp/mcp.{json,yaml}
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { validateConfig } from "./schema.js";
import type { McpConfig } from "./types.js";
import { ConfigError } from "../errors/custom-errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_DIR = path.join(process.env.HOME || "~", ".mcp");
const CONFIG_FILES = ["mcp.json", "mcp.yaml", "mcp.yml"];

/**
 * Substitute environment variables in config values
 * ${VAR_NAME} -> process.env.VAR_NAME
 */
function substituteEnvVars(obj: unknown): unknown {
    if (typeof obj === "string") {
        return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const value = process.env[varName];
            if (!value) {
                throw new ConfigError(
                    `Environment variable "${varName}" not found in config`
                );
            }
            return value;
        });
    }

    if (Array.isArray(obj)) {
        return obj.map(substituteEnvVars);
    }

    if (obj !== null && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substituteEnvVars(value);
        }
        return result;
    }

    return obj;
}

/**
 * Load configuration from ~/.mcp/mcp.json or mcp.yaml
 */
export function loadConfig(): McpConfig {
    // Try each config file
    for (const filename of CONFIG_FILES) {
        const configPath = path.join(CONFIG_DIR, filename);

        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, "utf-8");
                let parsed: unknown;

                if (filename.endsWith(".json")) {
                    parsed = JSON.parse(content);
                } else {
                    parsed = YAML.parse(content);
                }

                // Substitute environment variables
                parsed = substituteEnvVars(parsed);

                // Validate and return
                return validateConfig(parsed);
            } catch (error) {
                if (error instanceof ConfigError) {
                    throw error;
                }
                throw new ConfigError(
                    `Failed to parse configuration file ${configPath}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    }

    throw new ConfigError(
        `No MCP configuration found. Create ${path.join(CONFIG_DIR, "mcp.json")} or ${path.join(CONFIG_DIR, "mcp.yaml")}`
    );
}

/**
 * Get configuration with optional profile selected
 */
export function loadConfigWithProfile(
    profileName?: string
): { config: McpConfig; selectedServers: string[] } {
    const config = loadConfig();

    let selectedServers = config.servers.map((s) => s.name);

    if (profileName) {
        if (!config.profiles || !config.profiles[profileName]) {
            throw new ConfigError(`Profile "${profileName}" not found in config`);
        }
        selectedServers = config.profiles[profileName].servers;

        // Validate that all servers in profile exist
        const serverNames = config.servers.map((s) => s.name);
        for (const serverName of selectedServers) {
            if (!serverNames.includes(serverName)) {
                throw new ConfigError(
                    `Profile "${profileName}" references unknown server "${serverName}"`
                );
            }
        }
    }

    return { config, selectedServers };
}
