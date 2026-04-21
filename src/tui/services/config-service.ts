/**
 * TUI Config Service - Unified with Core CLI Configuration
 * 
 * Synchronizes TUI server management with ~/.mcp/mcp.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, loadConfigWithProfile } from '../../config/loader.js';
import { validateConfig } from '../../config/schema.js';
import type { McpConfig, ServerConfig } from '../../config/types.js';

export { ServerConfig };

export class ConfigService {
  private configDir: string;
  private configPath: string;
  private config: McpConfig | null = null;

  constructor() {
    // Standard ~/.mcp directory used by the CLI core
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.configDir = path.join(homeDir, '.mcp');
    this.configPath = path.join(this.configDir, 'mcp.json');
  }

  /**
   * Load configuration using the core CLI loader
   */
  async load(): Promise<McpConfig> {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Use core loader which handles JSON/YAML and env var substitution
      this.config = loadConfig();
      return this.config;
    } catch (error) {
      // If file doesn't exist, create an initial default config
      if (!fs.existsSync(this.configPath)) {
        this.config = {
          version: "1.0.0",
          servers: []
        };
        await this.save();
        return this.config;
      }
      
      throw error;
    }
  }

  /**
   * Save configuration to ~/.mcp/mcp.json
   */
  async save(): Promise<void> {
    if (!this.config) return;
    
    try {
      // Always save as JSON to the primary config path
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  /**
   * Get all servers
   */
  getServers(): ServerConfig[] {
    return this.config?.servers || [];
  }

  /**
   * Add server
   */
  async addServer(server: ServerConfig): Promise<boolean> {
    if (!this.config) await this.load();
    
    // Validate unique name
    if (this.config!.servers.some(s => s.name === server.name)) {
      return false;
    }

    this.config!.servers.push(server);
    await this.save();
    return true;
  }

  /**
   * Remove server
   */
  async removeServer(name: string): Promise<boolean> {
    if (!this.config) await this.load();
    
    const index = this.config!.servers.findIndex(s => s.name === name);
    if (index === -1) return false;

    this.config!.servers.splice(index, 1);
    await this.save();
    return true;
  }

  /**
   * Update server
   */
  async updateServer(name: string, updates: Partial<ServerConfig>): Promise<boolean> {
    if (!this.config) await this.load();
    
    const server = this.config!.servers.find(s => s.name === name);
    if (!server) return false;

    // Merge updates
    Object.assign(server, updates);
    
    // Re-validate to ensure schema compliance
    this.config = validateConfig(this.config);
    
    await this.save();
    return true;
  }
}

// Singleton instance
let instance: ConfigService | null = null;

export function getConfigService(): ConfigService {
  if (!instance) {
    instance = new ConfigService();
  }
  return instance;
}
