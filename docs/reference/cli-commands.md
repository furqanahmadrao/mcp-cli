# CLI Commands Reference

Complete reference for all `mcpcli` CLI commands and options.

## Command Structure

```
mcp [global-options] <command> [command-options]
```

## Global Options

These options work with any command:

### `--version`

Show the installed version of `mcpcli`.

```bash
$ mcp --version
mcpcli v0.1.0
```

### `--help`

Show help documentation.

```bash
$ mcp --help
$ mcp <command> --help  # Help for specific command
```

### `--verbose`

Enable debug logging to stderr. JSON output still goes to stdout.

```bash
$ mcp list --verbose
[2026-04-11T10:30:45.123Z] DEBUG: Loading configuration...
{
  "success": true,
  ...
}
```

## Commands

### `list`

Discover tools from all configured servers.

**Syntax:**

```bash
mcp list [options]
```

**Options:**

| Option             | Description                               |
| ------------------ | ----------------------------------------- |
| `--profile=<name>` | Use specific profile (default: "default") |
| `--verbose`        | Show debug logging                        |
| `--help`           | Show command help                         |

**Examples:**

```bash
# Discover all tools (default profile)
$ mcp list

# Discover from specific profile
$ mcp list --profile=production

# See debug information
$ mcp list --verbose

# Help for this command
$ mcp list --help
```

**Output Format:**

```json
{
  "success": true,
  "servers": {
    "server_name": {
      "status": "connected|failed",
      "tools": [
        {
          "name": "tool_name",
          "description": "Tool description",
          "inputSchema": {
            /* JSON Schema */
          }
        }
      ],
      "error": {
        /* if failed */
      }
    }
  },
  "aggregated": {
    "total": 5,
    "tools": [
      {
        "name": "server_name.tool_name",
        "server": "server_name",
        "description": "Tool description"
      }
    ]
  }
}
```

**Exit Codes:**

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Connection error

---

### `call`

Execute a tool with JSON parameters.

**Syntax:**

```bash
mcp call <tool_name> [json_input] [options]
```

**Arguments:**

| Argument       | Required | Description                             |
| -------------- | -------- | --------------------------------------- |
| `<tool_name>`  | ✅       | Full tool name: `server_name.tool_name` |
| `[json_input]` | ❌       | JSON parameters (default: `{}`)         |

**Options:**

| Option             | Description          |
| ------------------ | -------------------- |
| `--profile=<name>` | Use specific profile |
| `--verbose`        | Show debug logging   |
| `--help`           | Show command help    |

**Examples:**

```bash
# Execute tool with parameters
$ mcp call my_server.read_file '{"path":"/etc/hosts"}'

# Execute with empty parameters
$ mcp call my_server.list_dir '{}'

# Use specific profile
$ mcp call prod_server.query '{}' --profile=production

# See debug information
$ mcp call my_server.tool '{}' --verbose

# Help for this command
$ mcp call --help
```

**Output Format (Success):**

```json
{
  "success": true,
  "result": "Tool output or result",
  "toolName": "tool_name",
  "server": "server_name"
}
```

**Output Format (Error):**

```json
{
  "success": false,
  "error": {
    "type": "error_type",
    "message": "Human-readable error message",
    "details": {
      "tool": "tool_name",
      "server": "server_name"
      /* additional context */
    }
  }
}
```

**Exit Codes:**

- `0` - Tool executed successfully
- `1` - Tool executed but threw error
- `2` - Invalid input
- `3` - Tool not found
- `4` - Connection error

---

## Option Precedence

When options conflict, precedence is:

1. **Command-line options** (highest)
2. **Environment variables**
3. **Config file settings** (lowest)

Example:

```bash
# Even if config has --profile=staging:
mcp list --profile=production  # This takes precedence
```

## Short Flags

Some options have short equivalents:

| Long             | Short     | Example            |
| ---------------- | --------- | ------------------ |
| `--verbose`      | `-v`      | `mcp list -v`      |
| `--help`         | `-h`      | `mcp --help`       |
| `--version`      | `-V`      | `mcp -V`           |
| `--profile=name` | `-p name` | `mcp list -p prod` |

Not all shells support all short flags; use long form for compatibility.

## Exit Codes

Exit codes indicate the outcome:

| Code | Meaning          | Example                              |
| ---- | ---------------- | ------------------------------------ |
| `0`  | Success          | Tool executed or discovery succeeded |
| `1`  | General error    | Unknown error occurred               |
| `2`  | Config error     | Invalid config file                  |
| `3`  | Connection error | Can't connect to server              |
| `4`  | Tool not found   | Tool doesn't exist                   |
| `5`  | Invalid input    | JSON input doesn't match schema      |

**Capture exit code:**

```bash
mcp call my_tool '{}'
echo $?  # Linux/macOS
echo %errorlevel%  # Windows
```

## JSON Input

The `[json_input]` argument is a JSON string:

```bash
# Single parameter
mcp call tool '{"key":"value"}'

# Multiple parameters
mcp call tool '{"a":1,"b":"text","c":[1,2,3]}'

# Nested parameters
mcp call tool '{"config":{"nested":{"value":123}}}'
```

**Important:** Always quote the entire JSON string to prevent shell interpretation:

```bash
# ❌ Wrong - shell will interpret braces
mcp call tool {key:value}

# ✅ Correct - quoted string
mcp call tool '{"key":"value"}'

# ✅ Also correct - escaped quotes
mcp call tool "{\"key\":\"value\"}"
```

## Output Handling

### Capture JSON Output

```bash
# Save to file
mcp list > tools.json

# Pipe to jq for parsing
mcp list | jq '.aggregated.tools | length'

# Extract specific field
mcp call my_tool '{}' | jq '.result'
```

### View Logs Separately

```bash
# Save logs to file (stderr redirection)
mcp call tool '{}' 2> logs.txt

# View JSON only (suppress logs)
mcp call tool '{}' 2>/dev/null

# View logs only (suppress JSON)
mcp call tool '{}' 2>&1 1>/dev/null
```

## Scripting

### Bash Example

```bash
#!/bin/bash

# Get all tools
tools=$(mcp list)

# Extract tool count
count=$(echo "$tools" | jq '.aggregated.total')
echo "Found $count tools"

# Execute a tool
result=$(mcp call my_tool '{"param":"value"}')

# Check if successful
if echo "$result" | jq '.success' | grep -q 'true'; then
  echo "Success!"
else
  echo "Failed: $(echo "$result" | jq '.error.message')"
fi
```

### Python Example

```python
import subprocess
import json

# List tools
result = subprocess.run(['mcp', 'list'], capture_output=True, text=True)
tools = json.loads(result.stdout)

# Call a tool
result = subprocess.run(
    ['mcp', 'call', 'my_tool', '{"param":"value"}'],
    capture_output=True,
    text=True
)
output = json.loads(result.stdout)

if output['success']:
    print(f"Result: {output['result']}")
else:
    print(f"Error: {output['error']['message']}")
```

### Node.js Example

```javascript
const { execSync } = require("child_process");

// List tools
const listResult = execSync("mcp list", { encoding: "utf-8" });
const tools = JSON.parse(listResult);

// Call a tool
const callResult = execSync("mcp call my_tool '{}'", { encoding: "utf-8" });
const output = JSON.parse(callResult);

if (output.success) {
  console.log("Result:", output.result);
} else {
  console.error("Error:", output.error.message);
}
```

## Environment Variable Defaults

Set defaults via environment variables:

```bash
# Set default profile (override with --profile)
export MCP_PROFILE=production
mcp list  # Uses production profile

# Set verbosity
export MCP_VERBOSE=true
mcp list  # Runs with --verbose
```

## Debugging Commands

### Test Configuration

```bash
mcp list --verbose --profile=production
```

This shows:

- Configuration loading
- Server connection attempts
- Tool discovery from each server
- Any errors that occurred

### Test Tool Execution

```bash
mcp call server.tool '{"param":"value"}' --verbose
```

This shows:

- Tool resolution
- Input validation
- Server connection
- Tool execution
- Response handling

## Piping and Redirection

### Pipe to Other Tools

```bash
# Get tool count
mcp list | jq '.aggregated.total'

# Find specific tool
mcp list | jq '.aggregated.tools[] | select(.name=="my_tool")'

# Format as table (requires `column`)
mcp list | jq -r '.aggregated.tools[] | [.name, .description] | @csv' | column -t -s,

# Pretty-print JSON
mcp list | jq '.'
```

### Redirect Output

```bash
# Save discovery result
mcp list > discovered_tools.json

# Append to log file
mcp call tool '{}' >> operation.log

# Save both output and logs
mcp list > tools.json 2> discover.log

# Save everything to one file
mcp list &> all.log
```

## Performance Tips

### Reduce Server Count

```bash
# Instead of querying all servers
mcp list

# Use specific profile with fewer servers
mcp list --profile=essential
```

### Cache Results

```bash
# In shell script
TOOLS=$(mcp list)
echo "$TOOLS" | jq '.aggregated.tools'
echo "$TOOLS" | jq '.servers'
# Avoids calling mcp list twice
```

## Troubleshooting

### Command Not Found

```bash
# Reinstall
npm install -g mcpcli

# Check installation
npm list -g mcpcli
```

### Permission Denied

```bash
# On macOS/Linux
sudo npm install -g mcpcli --unsafe-perm

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

## Next Steps

- 🔧 **[Configuration Schema](config-schema.md)** — Config file format
- 🔐 **[Error Handling](errors.md)** — Error types and meanings
- 📚 **[How-to Guides](../guides/configuration.md)** — Practical examples
