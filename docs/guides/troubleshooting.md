# Troubleshooting

Solutions for common issues and problems with `mcpcli`.

## General Debugging

Enable verbose logging to see what's happening:

```bash
mcp list --verbose
mcp call my_tool '{}' --verbose
```

Verbose mode logs to **stderr** (doesn't interfere with JSON output):

```
[2026-04-11T10:30:45.123Z] DEBUG: Loading configuration...
[2026-04-11T10:30:45.234Z] DEBUG: Connecting to server: my_server
[2026-04-11T10:30:45.345Z] DEBUG: Tool discovery complete
```

## Installation Issues

### "Command not found: mcp"

**Problem:** After installing, `mcp` command doesn't work.

**Diagnosis:**

```bash
which mcp        # Check if in PATH
npm config get prefix  # Find npm bin directory
npm list -g mcpcli  # Verify it's installed
```

**Solutions:**

=== "Linux/macOS"

    Add npm bin to PATH:
    ```bash
    echo 'export PATH=$(npm config get prefix)/bin:$PATH' >> ~/.bashrc
    source ~/.bashrc

    # Or for zsh:
    echo 'export PATH=$(npm config get prefix)/bin:$PATH' >> ~/.zshrc
    source ~/.zshrc
    ```

=== "Windows"

    1. Find npm bin: `npm config get prefix`
    2. Copy the path (e.g., `C:\Users\User\AppData\Roaming\npm`)
    3. Add to PATH:
       - Windows 10/11: Settings → Environment Variables
       - Restart terminal
    4. Verify: `where mcp`

### "Permission Denied" or "EACCES"

**Problem:** Installation fails with permission error.

**Solution:**

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g mcpcli --unsafe-perm

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g mcpcli
```

### "npm: not found"

**Problem:** Node.js/npm not installed.

**Solution:**

1. Download [Node.js](https://nodejs.org/) (includes npm)
2. Install and verify: `node --version` and `npm --version`
3. Try `npm install -g mcpcli` again

## Configuration Issues

### "Config file not found"

**Problem:** Error: "Configuration file not found"

**Diagnosis:**

```bash
# Check if file exists
cat ~/.mcp/mcp.json           # macOS/Linux
type %USERPROFILE%\.mcp\mcp.json  # Windows
```

**Solutions:**

=== "Create Config"

    Create `~/.mcp/mcp.json`:
    ```json
    {
      "version": "1.0.0",
      "servers": [
        {
          "name": "my_server",
          "type": "stdio",
          "command": "node",
          "args": ["/path/to/server.js"]
        }
      ]
    }
    ```

=== "Check Path"

    **macOS/Linux:**
    ```bash
    mkdir -p ~/.mcp
    cat > ~/.mcp/mcp.json << 'EOF'
    {"version":"1.0.0","servers":[]}
    EOF
    ```

    **Windows:**
    ```powershell
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.mcp" -Force
    Set-Content -Path "$env:USERPROFILE\.mcp\mcp.json" -Value '{"version":"1.0.0","servers":[]}'
    ```

### "Invalid JSON in config"

**Problem:** Error: "Failed to parse configuration"

**Solution:**

1. Validate JSON at [jsonlint.com](https://jsonlint.com)
2. Check for common errors:
   - Missing commas between objects
   - Unquoted strings
   - Trailing commas
   - Single quotes instead of double quotes

```json
// ❌ Invalid
{ "servers": [ { "name": "test", } ] }  // Trailing comma!

// ✅ Valid
{ "servers": [ { "name": "test" } ] }
```

### Environment Variable Not Substituting

**Problem:** Config has `${VAR_NAME}` but it's not being replaced.

**Diagnosis:**

```bash
# Check if variable exists
echo $MY_VARIABLE  # macOS/Linux
echo %MY_VARIABLE%  # Windows
```

**Solutions:**

```bash
# Set the variable
export MY_VARIABLE="myvalue"
mcp list --verbose  # Check logs to verify substitution
```

If still not working:

```bash
# Verify variable is exported (not just set)
export MY_STRING="hello"
mcp list  # Now works

# Or in same command
MY_STRING="hello" mcp list
```

## Connection Issues

### "Server connection failed"

**Problem:** Error: "Failed to connect to server"

**Diagnosis:**

```bash
# Run with verbose output
mcp list --verbose

# Check if server is running
ps aux | grep "node /path/to/server.js"  # macOS/Linux
tasklist | findstr "node"  # Windows
```

**Solutions:**

1. **Start the server:**

   ```bash
   node /path/to/server.js
   # Or however your server is started
   ```

2. **Check the command path:**

   ```json
   {
     "command": "node",
     "args": ["/full/path/to/server.js"] // Absolute path!
   }
   ```

3. **Check executable exists:**

   ```bash
   which node  # Find node executable
   which python3  # Or for Python servers
   ```

4. **Check server logs:**
   ```bash
   # If server writes logs
   tail -f /var/log/mcp-server.log
   ```

### "Connection timeout"

**Problem:** Error: "Connection timed out"

**Diagnosis:**

- Server is running but not responding
- Network issues
- Server is very slow

**Solutions:**

```bash
# Increase timeout in config
{
  "servers": [{
    "timeout": 60000  // Increase from default 30000
  }]
}
```

Or check server health:

```bash
# Manually connect to server
nc -zv localhost 3000  # Test port connectivity
```

### "Authentication failed"

**Problem:** Error: "Authentication failed" or "Unauthorized"

**Diagnosis:**

```bash
mcp list --verbose  # See auth details in logs
```

**Solutions:**

=== "Bearer Token"

    1. Verify token is set:
       ```bash
       echo $API_TOKEN
       ```

    2. Verify token in config:
       ```json
       {
         "auth": {
           "type": "bearer",
           "token": "${API_TOKEN}"
         }
       }
       ```

    3. Check token hasn't expired:
       - Contact your API provider
       - Regenerate token if needed

=== "OAuth 2.0"

    1. Verify credentials:
       ```bash
       echo $OAUTH_CLIENT_ID
       echo $OAUTH_CLIENT_SECRET
       ```

    2. Check token URL is accessible:
       ```bash
       curl https://auth.example.com/oauth/token
       ```

    3. Request new token manually:
       ```bash
       curl -X POST https://auth.example.com/oauth/token \
         -d "client_id=$OAUTH_CLIENT_ID" \
         -d "client_secret=$OAUTH_CLIENT_SECRET"
       ```

## Tool Discovery Issues

### "No tools returned"

**Problem:** Server is connected but returns zero tools.

**Diagnosis:**

```bash
mcp list --verbose
# Check if server responds at all
```

**Solutions:**

1. **Server may not implement tools/list:**
   - Check server is MCP-compatible
   - Verify server version

2. **Server tools are filtered:**

   ```json
   {
     "servers": [
       {
         "name": "filtered_server"
         // May be filtering tools based on auth/profile
       }
     ]
   }
   ```

3. **Check server logs:**
   ```bash
   # Server might be throwing error
   # Review server's error output
   ```

### "Tool not found"

**Problem:** Error: "Tool not found: my_tool"

**Diagnosis:**

```bash
# List all available tools
mcp list | jq '.aggregated.tools[] | .name'
```

**Solutions:**

1. **Use correct server namespace:**

   ```bash
   # ❌ Wrong
   mcp call read_file '{"path":"/etc/hosts"}'

   # ✅ Correct
   mcp call my_server.read_file '{"path":"/etc/hosts"}'
   ```

2. **Verify tool actually exists:**

   ```bash
   mcp list --verbose
   # Check tool name in output
   ```

3. **Check tool spelling:**
   - Case-sensitive
   - No spaces
   - No special characters

### "Ambiguous tool name"

**Problem:** Error: "Tool name is ambiguous" or "Tool exists in multiple servers"

**Diagnosis:**

```bash
mcp list | jq '.aggregated.tools[] | .name' | sort | uniq -c | grep -v '^ *1 '
# Shows tools that appear in multiple servers
```

**Solution:**
Use fully-qualified name with server:

```bash
# ❌ Ambiguous
mcp call read_file '{"path":"/etc/hosts"}'

# ✅ Specific
mcp call server1.read_file '{"path":"/etc/hosts"}'
mcp call server2.read_file '{"path":"/etc/hosts"}'
```

## Tool Execution Issues

### "Invalid input"

**Problem:** Error: "Invalid input for tool"

**Diagnosis:**

```bash
# Check tool schema
mcp list --verbose | jq '.servers.server_name.tools[] | select(.name=="my_tool")'
```

**Solutions:**

1. **Validate JSON input:**

   ```bash
   # ❌ Invalid JSON
   mcp call my_tool '{invalid json}'

   # ✅ Valid JSON
   mcp call my_tool '{"key":"value"}'

   # Test at jsonlint.com
   ```

2. **Check required parameters:**

   ```bash
   # If tool requires 'path' parameter
   mcp call read_file '{"path":"/etc/hosts"}'
   # Not
   mcp call read_file '{}'
   ```

3. **Check parameter types:**

   ```bash
   # ❌ Wrong type
   mcp call add_numbers '{"a":"5","b":"3"}'

   # ✅ Correct type
   mcp call add_numbers '{"a":5,"b":3}'
   ```

### "Tool execution failed"

**Problem:** Tool runs but returns error.

**Diagnosis:**

```bash
mcp call my_tool '{}' --verbose
# Check error details in output
```

**Solutions:**

Depends on the tool. Check:

- Tool parameters are correct
- Tool has required permissions
- Tool has necessary resources
- Tool's documentation for error codes

## Output Issues

### "JSON is malformed"

**Problem:** JSON output is incomplete or invalid.

**Solution:**

```bash
# Redirect stderr to file to see logs
mcp call my_tool '{}' 2> debug.log

# Check if issue is in verbose output contaminating stdout
# Verbose output goes to stderr, JSON to stdout
```

### "Verbose output mixed with JSON"

**Problem:** Can't parse JSON because it has debug lines.

**Solution:**
Debug logs go to **stderr**, JSON to **stdout**. Separate them:

```bash
# Capture just JSON
mcp call my_tool '{}' 2>/dev/null | jq '.'

# Capture just debug logs
mcp call my_tool '{}' 2>&1 1>/dev/null

# Save both separately
mcp call my_tool '{}' > output.json 2> debug.log
```

## Performance Issues

### "Commands are slow"

**Problem:** Commands take too long to execute.

**Diagnosis:**

```bash
time mcp list
# Shows how long command takes
```

**Solutions:**

1. **Reduce number of servers:**
   Use specific profile with fewer servers:

   ```bash
   mcp list --profile=essential
   ```

2. **Increase timeouts:**

   ```json
   {
     "servers": [
       {
         "timeout": 60000 // More time for slow servers
       }
     ]
   }
   ```

3. **Parallel discovery:**
   mcpcli discovers from all servers in parallel. If you have 10 servers:
   - If one takes 5 seconds, total is ~5 seconds (parallel)
   - Not 50 seconds (sequential)

### "Memory usage is high"

**Problem:** `mcpcli` process uses too much RAM.

**Solution:**

- mcpcli is stateless and should use minimal memory
- If high memory, check:
  - Number of tools returned (huge responses)
  - Server leaks through stdio connection
  - System memory available

## Getting Help

If you can't solve the issue:

1. **Check the logs:**

   ```bash
   mcp command --verbose 2>&1 | tee debug.log
   ```

2. **Ask on GitHub:**
   - [Create an issue](https://github.com/yourusername/mcp-cli/issues)
   - Include `mcp --version`
   - Include config (without secrets)
   - Include verbose output

3. **Minimal reproduction:**
   ```bash
   # Simplify to smallest failing case
   mcp list --profile=minimal
   ```

## Next Steps

- 📖 **[CLI Reference](../reference/cli-commands.md)** — All commands
- 🔧 **[Configuration](configuration.md)** — Config options
- ❓ **[FAQ](#)** — Common questions
