# Your First Tool Discovery

In this tutorial, you'll discover tools from an MCP server for the first time. This takes **10 minutes**.

## What You'll Learn

By the end of this tutorial, you'll:

- ✅ Create a valid `mcpcli` configuration
- ✅ Connect to an MCP server
- ✅ Discover available tools
- ✅ Understand tool namespacing

## Prerequisites

- Node.js 18+ installed
- `mcpcli` [installed globally](../getting-started/installation.md)
- A working MCP server (we'll create a simple one, or you can use an existing one)

## Part 1: Create a Test MCP Server (5 minutes)

If you already have an MCP server, skip to **Part 2**.

Create a file `test-mcp-server.js`:

```javascript
// test-mcp-server.js
const MCP_VERSION = "2024-11-05";

const tools = [
  {
    name: "greet",
    description: "Greet someone by name",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The person's name" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_numbers",
    description: "Add two numbers together",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
];

async function handleMessage(message) {
  if (message.method === "initialize") {
    return {
      protocolVersion: MCP_VERSION,
      capabilities: {},
      serverInfo: { name: "test-server", version: "1.0.0" },
    };
  }

  if (message.method === "resources/list") {
    return { resources: [] };
  }

  if (message.method === "tools/list") {
    return { tools };
  }

  if (message.method === "tools/call") {
    const tool = tools.find((t) => t.name === message.params.name);
    if (!tool) {
      throw new Error(`Tool not found: ${message.params.name}`);
    }
    return { content: [{ type: "text", text: `Executed: ${tool.name}` }] };
  }
}

// Simple stdio handler
async function main() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let buffer = "";
  rl.on("line", async (line) => {
    buffer += line;
    try {
      const message = JSON.parse(buffer);
      buffer = "";
      const response = await handleMessage(message);
      console.log(JSON.stringify(response));
    } catch (e) {
      // Not a complete message yet
    }
  });
}

main().catch(console.error);
```

**Start the server:**

```bash
node test-mcp-server.js
```

Keep this terminal open—it's your MCP server.

## Part 2: Create Your Configuration (2 minutes)

In a **new terminal**, create `~/.mcp/mcp.json`:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "tutorial",
      "type": "stdio",
      "command": "node",
      "args": ["/full/path/to/test-mcp-server.js"],
      "timeout": 30000
    }
  ]
}
```

**Windows users:** Replace `/full/path/to/test-mcp-server.js` with `C:\full\path\to\test-mcp-server.js`

**Verify file exists:**

```bash
cat ~/.mcp/mcp.json  # macOS/Linux
type %USERPROFILE%\.mcp\mcp.json  # Windows
```

## Part 3: Discover Tools (2 minutes)

Run the discovery command:

```bash
$ mcp list
```

You should see output like:

```json
{
  "success": true,
  "servers": {
    "tutorial": {
      "status": "connected",
      "tools": [
        {
          "name": "greet",
          "description": "Greet someone by name"
        },
        {
          "name": "add_numbers",
          "description": "Add two numbers together"
        }
      ]
    }
  },
  "aggregated": {
    "total": 2,
    "tools": [
      {
        "name": "tutorial.greet",
        "server": "tutorial",
        "description": "Greet someone by name"
      },
      {
        "name": "tutorial.add_numbers",
        "server": "tutorial",
        "description": "Add two numbers together"
      }
    ]
  }
}
```

## Part 4: Understand Tool Namespacing (1 minute)

Notice the tool names in the output:

- ✅ **In `servers.tutorial.tools`:** Just `greet` and `add_numbers`
- ✅ **In `aggregated.tools`:** `tutorial.greet` and `tutorial.add_numbers`

**Why two formats?**

- **Per-server names** (`greet`) — How the tool is named on the server
- **Aggregated names** (`tutorial.greet`) — Unique across all servers, shows which server has the tool

This is **namespacing**. It prevents conflicts when you have multiple servers.

## Part 5: Try with Verbose Mode (1 minute)

Add `--verbose` to see what's happening behind the scenes:

```bash
$ mcp list --verbose
```

stderr output shows:

```
[2026-04-11T10:30:45.123Z] INFO: Discovering tools from profile: default
[2026-04-11T10:30:45.234Z] DEBUG: Discovering from server: tutorial
[2026-04-11T10:30:45.345Z] DEBUG: Connected to server: tutorial
[2026-04-11T10:30:45.456Z] DEBUG: Received 2 tools from tutorial
[2026-04-11T10:30:45.567Z] INFO: Discovery complete (1/1 servers connected)
```

stdout output is still the JSON.

## ✅ You Did It!

You've successfully:

- ✓ Created a configuration file
- ✓ Connected to an MCP server
- ✓ Discovered available tools
- ✓ Understood tool namespacing and aggregation
- ✓ Used verbose mode for debugging

## What's Next?

- 👉 **[Execute Your First Tool](first-execution.md)** — The next tutorial
- 🔧 **[Configuration Details](../guides/configuration.md)** — Learn more about config options
- 🌐 **[Add Multiple Servers](multi-server-setup.md)** — Discover from many servers at once

## Troubleshooting

**Server connection failed**

- Is your test server still running in the first terminal?
- Check the path in your config matches where the file actually exists

**Config file not found**

- Verify `~/.mcp/mcp.json` exists (use `cat` or File Explorer to check)
- On Windows, check `C:\Users\YourUsername\.mcp\mcp.json`

**No tools returned**

- Make sure the test server is running and connected
- Use `--verbose` flag to see detailed debug info
