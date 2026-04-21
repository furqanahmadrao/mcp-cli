# Error Handling Reference

Complete reference for all error types and handling in `mcpcli`.

## Error Response Format

All errors follow this JSON format:

```json
{
  "success": false,
  "error": {
    "type": "error_type_name",
    "message": "Human-readable error message",
    "details": {
      // Error-specific details
    }
  }
}
```

## Error Types

### connection

The CLI failed to connect to a server.

**HTTP Status:** N/A (not a network error)  
**Exit Code:** `3`

**Causes:**

- Server process not running
- Server command/path is wrong
- Server crashed or shut down
- Network unreachable
- Port in use or blocked

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Failed to connect to server: database",
    "details": {
      "server": "database",
      "command": "node /path/to/server.js",
      "reason": "ENOENT: no such file or directory"
    }
  }
}
```

**How to Fix:**

1. Verify server is running: `ps aux | grep server.js`
2. Check command path: `cat ~/.mcp/mcp.json | grep command`
3. Verify executable exists: `which node`
4. Check server logs for errors
5. Try running command manually to see actual error

---

### tool_not_found

The requested tool doesn't exist.

**HTTP Status:** 404  
**Exit Code:** `4`

**Causes:**

- Tool name misspelled
- Tool removed from server
- Tool doesn't exist on any configured server
- Using wrong server name

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "tool_not_found",
    "message": "Tool not found: read_file",
    "details": {
      "requested": "read_file",
      "available": ["database.read_file", "database.write_file", "api.query"]
    }
  }
}
```

**How to Fix:**

1. List available tools: `mcp list`
2. Use fully-qualified name: `server_name.tool_name`
3. Check tool name spelling (case-sensitive)
4. Verify tool exists on your servers

---

### invalid_input

The provided input doesn't match the tool's schema.

**HTTP Status:** 400  
**Exit Code:** `2`

**Causes:**

- JSON syntax error
- Missing required parameter
- Wrong parameter type
- Parameter value invalid

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "invalid_input",
    "message": "Invalid input for tool: add_numbers",
    "details": {
      "tool": "add_numbers",
      "server": "math_server",
      "schema": {
        "type": "object",
        "properties": {
          "a": { "type": "number" },
          "b": { "type": "number" }
        },
        "required": ["a", "b"]
      },
      "errors": [
        {
          "path": "$.a",
          "message": "must be number"
        }
      ]
    }
  }
}
```

**How to Fix:**

1. Validate JSON: `echo '{"a":"text"}' | jq .`
2. Check parameter types (string vs number)
3. Verify required parameters are present
4. Review tool schema from `mcp list`

---

### execution

The tool executed but threw an error.

**HTTP Status:** 500  
**Exit Code:** `1`

**Causes:**

- Tool encountered an error while running
- File not found
- Permission denied
- Invalid operation
- Server-side error

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "execution",
    "message": "Tool execution failed",
    "details": {
      "tool": "read_file",
      "server": "database",
      "toolError": {
        "message": "ENOENT: no such file or directory, open '/etc/nonexistent'"
      }
    }
  }
}
```

**How to Fix:**

1. Check tool error message for details
2. Verify resource exists (file, database, etc.)
3. Check permissions
4. Review server logs
5. Try operation manually to debug

---

### config

Configuration file is invalid.

**HTTP Status:** N/A  
**Exit Code:** `2`

**Causes:**

- Invalid JSON/YAML syntax
- Missing required fields
- Invalid field values
- File not found
- Permission denied

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "config",
    "message": "Configuration validation failed",
    "details": {
      "file": "~/.mcp/mcp.json",
      "errors": [
        {
          "path": "servers[0].type",
          "message": "must be 'stdio' or 'http'"
        }
      ]
    }
  }
}
```

**How to Fix:**

1. Validate JSON: `jsonlint ~/.mcp/mcp.json`
2. Check file format (JSON vs YAML)
3. Verify required fields present
4. Check field values against schema
5. See [Configuration Schema](config-schema.md) reference

---

### ambiguous_tool

Tool name exists on multiple servers and is ambiguous.

**HTTP Status:** 409  
**Exit Code:** `1`

**Causes:**

- Multiple servers have same tool name
- Using non-qualified tool name
- Two servers have overlapping tool names

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "ambiguous_tool",
    "message": "Tool name is ambiguous",
    "details": {
      "requested": "query",
      "matches": [
        { "name": "database.query", "server": "database" },
        { "name": "api.query", "server": "api" }
      ]
    }
  }
}
```

**How to Fix:**

1. Use fully-qualified name: `server_name.tool_name`
2. Or use a profile that only includes one server: `--profile=database_only`
3. Request the specific tool you need

---

### unknown

An unexpected error occurred.

**HTTP Status:** 500  
**Exit Code:** `1`

**Causes:**

- Unexpected internal error
- Unhandled exception
- System resource exhausted
- Unknown state

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "unknown",
    "message": "An unexpected error occurred",
    "details": {
      "originalError": "Out of memory"
    }
  }
}
```

**How to Fix:**

1. Enable verbose mode: `--verbose`
2. Check system resources (memory, disk)
3. Report to github with verbose output
4. Try again after removing unnecessary processes

---

## HTTP Server Errors

When using HTTP servers, you may see these additional errors:

### Network Errors

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Network error: ECONNREFUSED",
    "details": {
      "url": "https://api.example.com/mcp",
      "reason": "Connection refused"
    }
  }
}
```

**Causes:** Server offline, firewall blocked, wrong host/port

### SSL/TLS Errors

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "SSL certificate validation failed",
    "details": {
      "url": "https://api.example.com/mcp",
      "reason": "SELF_SIGNED_CERT_IN_CHAIN"
    }
  }
}
```

**Cause:** Invalid/self-signed certificate

### Timeout Errors

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Request timeout",
    "details": {
      "timeout": 30000,
      "url": "https://api.example.com/mcp"
    }
  }
}
```

**Cause:** Server took too long to respond  
**Fix:** Increase timeout in config

---

## Authentication Errors

### Bearer Token Error

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Authentication failed",
    "details": {
      "reason": "HTTP 401 Unauthorized",
      "authType": "bearer"
    }
  }
}
```

**Cause:** Invalid or expired token  
**Fix:** Update token in environment variable

### OAuth Error

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "OAuth token exchange failed",
    "details": {
      "tokenUrl": "https://auth.example.com/token",
      "reason": "Invalid client credentials"
    }
  }
}
```

**Cause:** Wrong client ID/secret  
**Fix:** Verify OAuth credentials in config

---

## Handling Errors in Scripts

### Bash

```bash
#!/bin/bash

result=$(mcp call my_tool '{}' 2>/dev/null)

# Check if successful
if echo "$result" | jq -e '.success' > /dev/null; then
  echo "Success: $(echo "$result" | jq '.result')"
else
  error_type=$(echo "$result" | jq -r '.error.type')
  error_msg=$(echo "$result" | jq -r '.error.message')
  echo "Error ($error_type): $error_msg"
  exit 1
fi
```

### Python

```python
import subprocess
import json

try:
    result = subprocess.run(
        ['mcp', 'call', 'my_tool', '{}'],
        capture_output=True,
        text=True,
        check=False
    )

    output = json.loads(result.stdout)

    if output['success']:
        print(f"Result: {output['result']}")
    else:
        error = output['error']
        print(f"Error ({error['type']}): {error['message']}")
        if 'details' in error:
            print(f"Details: {error['details']}")

except json.JSONDecodeError:
    print("Failed to parse response")
    print(result.stdout)
```

### Node.js

```javascript
const { execSync } = require("child_process");

try {
  const result = execSync("mcp call my_tool '{}'", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  const output = JSON.parse(result);

  if (output.success) {
    console.log("Result:", output.result);
  } else {
    const error = output.error;
    console.error(`Error (${error.type}): ${error.message}`);
    if (error.details) {
      console.error("Details:", error.details);
    }
  }
} catch (error) {
  console.error("Command failed:", error.message);
}
```

---

## Debugging Errors

### Enable Verbose Mode

```bash
mcp call my_tool '{}' --verbose 2>&1
```

Verbose output to stderr shows:

- Configuration loading
- Server connections
- Input validation
- Tool execution steps
- Full error stack traces

### Check Exit Code

```bash
mcp call my_tool '{}' || echo "Exit code: $?"
```

### Save Error Details

```bash
# Save full response including error details
mcp call my_tool '{}' > response.json 2> debug.log

# View error details
cat response.json | jq '.error'

# View debug logs
cat debug.log
```

---

## Common Error Scenarios

### "tool_not_found" → "ambiguous_tool"

```bash
# First, you get:
$ mcp call read_file '{"path":"/etc/hosts"}'
# Error: tool_not_found "Tool not found: read_file"

# After adding server name:
$ mcp call server1.read_file '{"path":"/etc/hosts"}'
$ mcp call server2.read_file '{"path":"/etc/hosts"}'
# But both servers have "read_file":
# Error: ambiguous_tool "Tool name is ambiguous"

# Solution: use specific server name or single-server profile
```

### "invalid_input" → "execution"

```bash
# First, input validation catches error:
$ mcp call tool '{"a":"not a number"}'
# Error: invalid_input

# After fixing input:
$ mcp call tool '{"a":5}'
# But tool still fails:
# Error: execution "Tool execution failed: resource not found"
```

---

## Next Steps

- 📖 **[CLI Commands](cli-commands.md)** — Command reference
- 🔧 **[Configuration Schema](config-schema.md)** — Config format
- ❓ **[Troubleshooting](../guides/troubleshooting.md)** — Problem solutions
