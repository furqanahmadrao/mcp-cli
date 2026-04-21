# mcp - MCP Gateway CLI Client

> **⚠️ This project is in early development.** The API may change. Contributions welcome!

Lightweight MCP CLI that acts as a stateless gateway - enabling agents to discover and execute MCP tools without Docker, SDK integration, or background processes.

## Features

- **Tool Discovery**: `mcp list` - Discover tools across all configured MCP servers
- **Tool Execution**: `mcp call <tool> <json>` - Execute MCP tools with JSON input
- **Multi-Transport**: Support for stdio and HTTP servers
- **Developer-Friendly**: Clear JSON output, optional verbose logging, deterministic behavior
- **Stateless**: Each command connects, executes, and closes - no persistent state
- **Agent-Ready**: Perfect for LLM agents that need tool access

## Installation

```bash
npm install -g mcp
```

Or use directly without installation:

```bash
npx mcp list
```

## Quick Start

### 1. Create Configuration

Create `~/.mcp/mcp.json`:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "local",
      "type": "stdio",
      "command": "node /path/to/server.js"
    }
  ]
}
```

### 2. List Tools

```bash
mcp list
```

Returns:
```json
{
  "success": true,
  "servers": { ... },
  "aggregated": {
    "total": 5,
    "tools": [
      {
        "name": "local.read_file",
        "server": "local",
        "description": "Read a file..."
      }
    ]
  }
}
```

### 3. Execute a Tool

```bash
mcp call local.read_file '{"path":"/etc/hosts"}'
```

Returns:
```json
{
  "success": true,
  "result": "Host file content..."
}
```

## Configuration

### File Location
`~/.mcp/mcp.json` (or `.yaml`/`.yml`)

### Format

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "server1",
      "type": "stdio",
      "command": "node server.js",
      "args": ["--config=prod.json"],
      "timeout": 30000
    },
    {
      "name": "server2",
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "auth": {
        "type": "bearer",
        "token": "${API_TOKEN}"
      }
    }
  ],
  "profiles": {
    "dev": {
      "servers": ["server1"]
    },
    "prod": {
      "servers": ["server1", "server2"]
    }
  }
}
```

### Authentication

**Bearer Token:**
```json
{
  "auth": {
    "type": "bearer",
    "token": "${MY_API_TOKEN}"
  }
}
```

**OAuth 2.0:**
```json
{
  "auth": {
    "type": "oauth",
    "client_id": "${OAUTH_CLIENT_ID}",
    "client_secret": "${OAUTH_CLIENT_SECRET}",
    "token_url": "https://auth.example.com/token",
    "scopes": ["tool:read", "tool:execute"]
  }
}
```

Environment variables can be substituted using `${VAR_NAME}` syntax.

### Profiles

Use profiles to group servers for different environments:

```bash
mcpcli list --profile=dev
mcpcli call tool_name '{}' --profile=prod
```

## Commands

### `mcpcli list [options]`

Discover all available tools from configured servers.

**Options:**
- `--profile <name>` - Use a specific profile (default: all servers)
- `--verbose` - Enable verbose logging to stderr

**Output:** JSON object with `success`, `servers`, and aggregated `tools`

### `mcpcli call <tool> [input] [options]`

Execute a specific tool.

**Arguments:**
- `<tool>` - Tool name (auto-search) or `server.tool_name` for explicit server
- `[input]` - JSON input object (default: `{}`)

**Options:**
- `--profile <name>` - Use a specific profile (default: all servers)
- `--verbose` - Enable verbose logging to stderr

**Output:** JSON object with `success` and `result` or `error`

## Error Handling

All errors are returned in JSON format:

```json
{
  "success": false,
  "error": {
    "type": "error_type",
    "message": "Human-readable description"
  }
}
```

### Error Types

- `connection_error` - Failed to connect to a server
- `tool_not_found` - Tool doesn't exist
- `invalid_input` - JSON input is invalid or doesn't match tool schema
- `execution_error` - Tool executed but failed
- `config_error` - Configuration file issue
- `ambiguous_tool` - Tool name matches multiple servers

## Agent Integration Example

```typescript
// Discover tools
const listResult = await exec('mcpcli list');
const tools = JSON.parse(listResult).aggregated.tools;

// Execute tool
const callResult = await exec('mcpcli call github.search_repos \'{"query":"ai"}\'');
const result = JSON.parse(callResult).result;
```

## Troubleshooting

### "No MCP configuration found"

Create `~/.mcp/mcp.json` with your MCP servers.

### "Failed to connect to server"

- Check server is running and accessible
- Verify `type`, `command` (for stdio), or `url` (for HTTP)
- Try `--verbose` to see detailed error messages

### "Tool not found"

- Run `mcpcli list` to see available tools
- Use `mcpcli list --verbose` to verify server connections

### JSON output is unclear

- Use `--verbose` flag (logs debug info to stderr, JSON stays on stdout)
- Parse JSON output programmatically for agent use

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Test
npm run test

# Lint
npm run lint
```

## Architecture

```
mcpcli
├── CLI Layer (commands/options parsing)
├── Discovery Handler (list tools from servers)
├── Execution Handler (resolve & call tools)
├── Gateway Coordinator (MCP client lifecycle)
├── Tool Registry (namespacing & resolution)
├── Config Loader (JSON/YAML with env substitution)
└── Error Handling (consistent JSON responses)
```

## Reference

- **MCP Spec**: https://spec.modelcontextprotocol.io/
- **Docker MCP Gateway**: https://github.com/docker/mcp-gateway
- **Official SDK**: https://github.com/modelcontextprotocol/typescript-sdk

## Contributing

Contributions are welcome! Please read the [contribution guidelines](docs/contributing/index.md) before submitting PRs.

### Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Test
npm run test

# Lint
npm run lint
```

## License

MIT
