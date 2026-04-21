# Tool Namespacing

Understanding how tool namespacing works and why it matters.

## The Problem Without Namespacing

Imagine you have two MCP servers, both providing similar tools:

```
Database Server:
  ├─ query
  ├─ insert
  └─ delete

API Server:
  ├─ query
  ├─ create
  └─ remove
```

**Problem:** When you run `mcp call query '{}' `, which one gets executed?

- ❌ Ambiguous
- ❌ Undefined behavior
- ❌ Risk of wrong tool executing
- ❌ Users make mistakes

---

## The Solution: Namespacing

Prefix tool names with server name:

```
database.query      ← This tool
api.query          ← Not this one
database.insert
database.delete
api.create
api.remove
```

**Now:** `mcp call database.query '{}' ` is unambiguous.

---

## How Namespacing Works

### Discovery Output

When you run `mcp list`, tools are returned in two views:

**Per-Server (raw):**

```json
{
  "servers": {
    "database": {
      "tools": [
        { "name": "query", ... },
        { "name": "insert", ... }
      ]
    },
    "api": {
      "tools": [
        { "name": "query", ... },
        { "name": "create", ... }
      ]
    }
  }
}
```

**Aggregated (namespaced):**

```json
{
  "aggregated": {
    "tools": [
      { "name": "database.query", "server": "database", ... },
      { "name": "database.insert", "server": "database", ... },
      { "name": "api.query", "server": "api", ... },
      { "name": "api.create", "server": "api", ... }
    ]
  }
}
```

### Execution

When executing, use namespaced form:

```bash
$ mcp call database.query '{"sql":"SELECT..."}'
# Executes on database server

$ mcp call api.query '{"endpoint":"/users"}'
# Executes on api server
```

---

## Namespace Format

### Structure

```
<server_name>.<tool_name>
```

### Rules

1. **Server name** - From config `servers[].name`
2. **Tool name** - From server's tools/list response
3. **Separator** - Single dot (`.`)
4. **Case sensitive** - Exact match required

### Examples

```
database.query              ✅ Valid
my_server.tool_name        ✅ Valid
api-server.create_user     ✅ Valid
database.query.test        ❌ Invalid (nested dots)
database .query            ❌ Invalid (space)
databasequery              ❌ Invalid (no separator)
```

---

## Under the Hood: Tool Registry

The ToolRegistry manages namespacing:

```typescript
class ToolRegistry {
  // Store: {
  //   "database": [{ name: "query", ... }],
  //   "api": [{ name: "query", ... }]
  // }

  register(server, tools) {
    this.tools[server] = tools;
  }

  resolve(toolName) {
    // "database.query" → Find tool "query" on server "database"
    const [server, tool] = toolName.split(".");
    return this.tools[server]?.find((t) => t.name === tool);
  }

  aggregate() {
    // Return all tools with namespace:
    // "database.query", "api.query", etc.
  }
}
```

---

## Conflict Detection

### Ambiguous Tool Names

If you have:

```
server1.read
server2.read
```

And you try:

```bash
mcp call read '{"path":"/etc/hosts"}'
```

Error:

```json
{
  "success": false,
  "error": {
    "type": "ambiguous_tool",
    "message": "Tool name is ambiguous",
    "details": {
      "matches": [
        { "name": "server1.read", "server": "server1" },
        { "name": "server2.read", "server": "server2" }
      ]
    }
  }
}
```

**Solution:** Use fully-qualified name:

```bash
mcp call server1.read '{"path":"/etc/hosts"}'
```

---

## Profile-Based Resolution

Namespacing works with profiles:

**Config:**

```json
{
  "servers": [
    { "name": "prod_db", ... },
    { "name": "staging_db", ... }
  ],
  "profiles": {
    "production": {
      "servers": ["prod_db"]
    }
  }
}
```

**Usage:**

```bash
# With production profile
mcp list --profile=production
# Returns: prod_db.query (not staging_db.query)

mcp call prod_db.query '{}' --profile=production
# Works

mcp call staging_db.query '{}' --profile=production
# Error: tool not found (staging_db not in profile)
```

---

## Practical Examples

### Example 1: Multiple Database Servers

```json
{
  "servers": [
    { "name": "sql_db", ... },
    { "name": "nosql_db", ... }
  ]
}
```

**Tools available:**

- `sql_db.query` - SQL queries
- `nosql_db.find` - NoSQL queries

**Usage:**

```bash
# Query SQL
mcp call sql_db.query '{"sql":"SELECT * FROM users"}'

# Query NoSQL
mcp call nosql_db.find '{"collection":"users"}'
```

### Example 2: Staging and Production

```json
{
  "servers": [
    { "name": "prod_api", "url": "https://api.prod.company.com" },
    { "name": "staging_api", "url": "https://api.staging.company.com" }
  ],
  "profiles": {
    "production": { "servers": ["prod_api"] },
    "staging": { "servers": ["staging_api"] }
  }
}
```

**Usage:**

```bash
# Talk to production
mcp call prod_api.create_user '{}' --profile=production

# Talk to staging
mcp call staging_api.create_user '{}' --profile=staging

# Try production tool on staging profile
mcp call prod_api.create_user '{}' --profile=staging
# Error: tool not found
```

### Example 3: Microservices Architecture

```json
{
  "servers": [
    { "name": "auth_service", ... },
    { "name": "user_service", ... },
    { "name": "order_service", ... }
  ]
}
```

**Discovery:**

```
auth_service.login
auth_service.logout

user_service.get_profile
user_service.update_profile

order_service.create_order
order_service.list_orders
```

**Usage:**

```bash
# Auth flow
mcp call auth_service.login '{"username":"alice","password":"secret"}'

# User operations
mcp call user_service.get_profile '{"id":"user123"}'

# Order operations
mcp call order_service.create_order '{"user_id":"user123","items":[...]}'
```

---

## Design Rationale

### Why Not Just Tool Name?

```bash
# ❌ This seems simpler
mcp call query '{"sql":"..."}'

# But breaks with multiple servers
mcp call query '{"endpoint":"/users"}'  # Which server?
```

### Why Explicit?

```bash
# ✅ Always clear
mcp call database.query '{"sql":"..."}'
mcp call api.query '{"endpoint":"/users"}'
```

**Benefits:**

- No ambiguity
- Self-documenting
- Easy for agents to reason about
- Scales with many servers

---

## Namespace Handling in Different Contexts

### Shell Scripts

```bash
#!/bin/bash

# You know which server you want
DATABASE_TOOL="prod_db.query"

result=$(mcp call "$DATABASE_TOOL" '{"sql":"SELECT COUNT(*) FROM users"}')

count=$(echo "$result" | jq '.result')
echo "User count: $count"
```

### LLM Agent Context

When an agent gets the discovery response:

```json
{
  "name": "database.query",
  "description": "Execute a SQL query",
  "server": "database"
}
```

The agent can:

1. See which server provides the tool
2. Remember to use the exact name: `database.query`
3. Not get confused with other `query` tools

### Programmatic Usage

```python
import subprocess
import json

# Get available tools
result = subprocess.run(['mcp', 'list'], capture_output=True, text=True)
tools = json.loads(result.stdout)

# Find a specific tool
for tool in tools['aggregated']['tools']:
    if tool['name'] == 'database.query':
        tool_name = tool['name']
        break

# Execute it
result = subprocess.run(
    ['mcp', 'call', tool_name, '{"sql":"SELECT 1"}'],
    capture_output=True,
    text=True
)
```

---

## Troubleshooting

### "Tool not found: my_tool"

**Problem:** Using tool name without server prefix.

**Solution:**

```bash
# ❌ Wrong
mcp call my_tool '{"param":"value"}'

# ✅ Correct
mcp call server_name.my_tool '{"param":"value"}'

# First, discover available tools
mcp list
```

### "Tool name is ambiguous"

**Problem:** Tool exists on multiple servers.

**Solution:**

```bash
# ❌ Ambiguous
mcp call query '{}'

# ✅ Specific
mcp call database.query '{}'

# Or use profile with single server
mcp list --profile=database_only
```

### Tool not in discovery but exists in config

**Problem:** Server in config but not in discovery output.

**Diagnosis:**

```bash
mcp list --verbose
# Check which servers are "connected" vs "failed"
```

**Solution:**

- Verify server is running
- Check server name in config
- Check timeout is sufficient

---

## Migration Path (Single Server → Multiple)

### Stage 1: Single Server

```json
{
  "servers": [
    { "name": "main", ... }
  ]
}
```

**Usage:** `mcp call main.query '{}'`

### Stage 2: Add Second Server

```json
{
  "servers": [
    { "name": "main", ... },
    { "name": "backup", ... }
  ]
}
```

**Usage:**

```bash
mcp call main.query '{}'    # Main server
mcp call backup.query '{}'  # Backup server
```

**No breaking changes!** Existing commands still work.

---

## Next Steps

- 🔐 **[Design Philosophy](design-philosophy.md)** — Why explicit design
- 🏗️ **[Architecture](architecture.md)** — System design
- 📚 **[How-to Guides](../guides/configuration.md)** — Practical examples
