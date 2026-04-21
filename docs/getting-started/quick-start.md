# Quick Start Guide

Get `mcpcli` up and running in **5 minutes**.

## Prerequisites

- **Node.js** 18 or later
- **npm** or **yarn**
- An MCP server (we'll use an example if you don't have one)

**Check your Node.js version:**

```bash
node --version  # Should be v18.0.0 or higher
```

## Step 1: Install mcpcli

Choose your preferred installation method:

**Global Installation (Recommended)**

```bash
npm install -g mcpcli
```

**Verify Installation**

```bash
mcp --version
# Output: mcpcli v0.1.0
```

## Step 2: Create Your First Configuration

Create a file at `~/.mcp/mcp.json`:

=== "Using an existing MCP server"

    ```json
    {
      "version": "1.0.0",
      "servers": [
        {
          "name": "my_server",
          "type": "stdio",
          "command": "node",
          "args": ["/path/to/mcp-server.js"]
        }
      ]
    }
    ```

=== "Using a remote HTTP server"

    ```json
    {
      "version": "1.0.0",
      "servers": [
        {
          "name": "remote_api",
          "type": "http",
          "url": "https://api.example.com/mcp"
        }
      ]
    }
    ```

!!! tip "Config Location"
On Windows: `C:\Users\YourName\.mcp\mcp.json`  
 On Mac/Linux: `~/.mcp/mcp.json`  
 You can also use `mcp.yaml` for YAML format.

## Step 3: Discover Available Tools

List all tools from your configured servers:

```bash
$ mcp list

{
  "success": true,
  "servers": {
    "my_server": {
      "status": "connected",
      "tools": [
        {
          "name": "read_file",
          "description": "Read file contents"
        },
        {
          "name": "write_file",
          "description": "Write file contents"
        }
      ]
    }
  },
  "aggregated": {
    "total": 2,
    "tools": [
      {
        "name": "my_server.read_file",
        "server": "my_server",
        "description": "Read file contents"
      },
      {
        "name": "my_server.write_file",
        "server": "my_server",
        "description": "Write file contents"
      }
    ]
  }
}
```

## Step 4: Execute Your First Tool

Execute a tool with JSON inputs:

```bash
$ mcp call my_server.read_file '{"path": "/etc/hostname"}'

{
  "success": true,
  "result": "mycomputer\n"
}
```

## Step 5: Use Verbose Mode for Debugging

Add `--verbose` to see debug information:

```bash
$ mcp call my_server.read_file '{"path": "/etc/hostname"}' --verbose

# stderr output (debug info):
[2026-04-11T10:30:45.123Z] INFO: Discovering tools...
[2026-04-11T10:30:45.234Z] DEBUG: Connecting to server: my_server
[2026-04-11T10:30:45.456Z] DEBUG: Executing tool: read_file
[2026-04-11T10:30:45.567Z] INFO: Tool execution succeeded

# stdout output (JSON result):
{
  "success": true,
  "result": "mycomputer\n"
}
```

## Common Commands Reference

| Command                                  | Purpose                         |
| ---------------------------------------- | ------------------------------- |
| `mcp list`                               | Discover all tools from servers |
| `mcp call <tool> '<json>'`               | Execute a tool                  |
| `mcp --help`                             | Show all available commands     |
| `mcp list --verbose`                     | List tools with debug output    |
| `mcp call <tool> '<json>' --profile=dev` | Use specific profile            |

## Troubleshooting Basics

**"Server connection failed"**

- Verify your MCP server is running
- Check the `command` path in your config
- Use `--verbose` to see connection details

**"Tool not found"**

- Run `mcp list` to verify the tool exists
- Use correct tool name: `server_name.tool_name`

**"Invalid JSON input"**

- Ensure your JSON is valid (use [jsonlint.com](https://jsonlint.com))
- Quote the entire JSON string: `mcp call tool '{"key":"value"}'`

## Next Steps

- 📖 **[Configuration Guide](../guides/configuration.md)** — Advanced config options
- 🔐 **[Authentication](../guides/auth-bearer.md)** — Add bearer tokens or OAuth
- 🛠️ **[Tutorials](../tutorials/first-discovery.md)** — Step-by-step lessons
- ❓ **[Troubleshooting](../guides/troubleshooting.md)** — Help with common issues

## Getting Help

- **[Full CLI Reference](../reference/cli-commands.md)** — All commands and options
- **[GitHub Issues](https://github.com/yourusername/mcp-cli/issues)** — Report bugs
- **[FAQ](#)** — Common questions
