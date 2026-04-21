# Configuration Schema Reference

Complete reference for the `mcp.json` or `mcp.yaml` configuration file format.

## File Location

```
~/.mcp/mcp.json
~/.mcp/mcp.yaml
~/.mcp/mcp.yml
```

**Priority:** JSON > YAML > YAML variations (first found is used)

## Root Schema

```typescript
{
  version: string                    // Config version (e.g., "1.0.0")
  servers: Server[]                  // Array of MCP servers
  profiles?: Record<string, Profile> // Named server groups
}
```

## Server Object

### Common Fields

```typescript
{
  name: string                       // Unique server identifier (required)
  type: "stdio" | "http"            // Server type (required)
  timeout?: number                   // Request timeout in milliseconds (default: 30000)
  auth?: {
    type: "bearer" | "oauth" | "none"
    // Additional fields depend on auth type...
  }
}
```

### Stdio Server

For local MCP servers via standard input/output:

```typescript
{
  name: string                       // Unique name
  type: "stdio"                      // Must be "stdio"
  command: string                    // Executable (required)
  args?: string[]                    // Command arguments
  env?: Record<string, string>       // Environment variables
  timeout?: number                   // Timeout in ms (default: 30000)
  auth?: never                        // Stdio servers don't use auth
}
```

**Example:**

```json
{
  "name": "local_db",
  "type": "stdio",
  "command": "node",
  "args": ["/path/to/db-server.js", "--config=/etc/db.yml"],
  "env": {
    "LOG_LEVEL": "info",
    "NODE_ENV": "production"
  },
  "timeout": 60000
}
```

**Fields:**

- **`command`** (string, required): Executable name or full path
  - Examples: `"node"`, `"python3"`, `"/usr/local/bin/ruby"`
- **`args`** (array of strings, optional): Command-line arguments
  - Passed after command to executable
- **`env`** (object, optional): Environment variables
  - Merged with parent process environment
  - Values support `${VAR}` substitution
- **`timeout`** (number, optional): Max milliseconds to wait for responses
  - Default: 30000 (30 seconds)
  - Min: 1000 (1 second)
  - Max: 300000 (5 minutes)

### HTTP Server

For remote MCP servers via HTTP:

```typescript
{
  name: string                       // Unique name
  type: "http"                       // Must be "http"
  url: string                        // MCP endpoint URL (required)
  timeout?: number                   // Timeout in ms (default: 30000)
  auth?: {
    type: "bearer" | "oauth"
    // Bearer OR OAuth specific fields
  }
}
```

**Example:**

```json
{
  "name": "remote_api",
  "type": "http",
  "url": "https://api.example.com/mcp",
  "timeout": 10000,
  "auth": {
    "type": "bearer",
    "token": "${API_TOKEN}"
  }
}
```

**Fields:**

- **`url`** (string, required): Full HTTPS URL to MCP endpoint
  - Format: `https://host[:port]/path`
  - Must be HTTPS (HTTP is not supported)
- **`timeout`** (number, optional): Max milliseconds to wait for response
  - Default: 30000 (30 seconds)

### Authentication Objects

#### Bearer Token

```typescript
{
  type: "bearer"; // Must be "bearer"
  token: string; // API token (supports ${VAR})
}
```

**Example:**

```json
{
  "type": "bearer",
  "token": "${API_KEY}"
}
```

Used for HTTP servers with static API keys.

#### OAuth 2.0 Client Credentials

```typescript
{
  type: "oauth"                      // Must be "oauth"
  clientId: string                   // OAuth client ID (required, supports ${VAR})
  clientSecret: string               // OAuth client secret (required, supports ${VAR})
  tokenUrl: string                   // Token endpoint URL (required, supports ${VAR})
  scope?: string                     // Space-separated scopes (optional, supports ${VAR})
  audience?: string                  // API audience identifier (optional, supports ${VAR})
}
```

**Example:**

```json
{
  "type": "oauth",
  "clientId": "${OAUTH_CLIENT_ID}",
  "clientSecret": "${OAUTH_CLIENT_SECRET}",
  "tokenUrl": "https://auth.example.com/oauth/token",
  "scope": "mcp:read mcp:write",
  "audience": "https://api.example.com"
}
```

**Fields:**

- **`clientId`** (string, required): OAuth client identifier
- **`clientSecret`** (string, required): OAuth client secret
  - **Important:** Never commit to version control
- **`tokenUrl`** (string, required): OAuth token endpoint URL
  - Must be HTTPS
  - Endpoint that provides access tokens
- **`scope`** (string, optional): Requested OAuth scopes
  - Multiple scopes separated by spaces
  - Examples: `"read"`, `"read write"`, `"mcp:discover mcp:execute"`
- **`audience`** (string, optional): API audience identifier
  - Used by some authorization servers
  - Restricts token to specific API

## Profile Object

```typescript
{
  servers: string[]                  // Array of server names to include
  description?: string               // Optional description of this profile
}
```

**Example:**

```json
{
  "servers": ["prod_db", "prod_api"],
  "description": "Production environment servers"
}
```

**Fields:**

- **`servers`** (array of strings): List of server names to activate
  - Names must match server `name` fields
  - Used when `--profile=name` specified
  - If profile doesn't exist, error is returned

## Environment Variable Substitution

In string fields, use `${VAR_NAME}` syntax:

```json
{
  "servers": [
    {
      "name": "example",
      "type": "http",
      "url": "${MCP_SERVER_URL}",
      "auth": {
        "type": "bearer",
        "token": "${API_TOKEN}"
      }
    }
  ]
}
```

**Usage:**

```bash
export MCP_SERVER_URL="https://api.example.com/mcp"
export API_TOKEN="sk_live_123456789"
mcp list
```

**Features:**

- Substitution happens at config load time
- Missing variables cause error
- Supports all string fields
- Cannot use in non-string fields (arrays, objects, numbers)

## Complete Schema with Comments

```json
{
  "version": "1.0.0",

  "servers": [
    {
      "name": "production_database",
      "type": "stdio",
      "command": "node",
      "args": ["/opt/mcp-servers/database.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn"
      },
      "timeout": 60000
    },
    {
      "name": "staging_api",
      "type": "http",
      "url": "https://staging-api.company.com/mcp",
      "timeout": 30000,
      "auth": {
        "type": "bearer",
        "token": "${STAGING_API_TOKEN}"
      }
    },
    {
      "name": "external_service",
      "type": "http",
      "url": "https://external.service.com/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "${EXTERNAL_CLIENT_ID}",
        "clientSecret": "${EXTERNAL_CLIENT_SECRET}",
        "tokenUrl": "https://auth.external.service.com/token",
        "scope": "mcp:read mcp:write"
      }
    }
  ],

  "profiles": {
    "default": {
      "servers": ["staging_api"],
      "description": "Default profile uses staging only"
    },
    "production": {
      "servers": ["production_database", "staging_api"],
      "description": "Production environment"
    },
    "all": {
      "servers": ["production_database", "staging_api", "external_service"],
      "description": "All available servers"
    }
  }
}
```

## YAML Format

Configuration can also be in YAML format (`~/.mcp/mcp.yaml`):

```yaml
version: "1.0.0"

servers:
  - name: local_server
    type: stdio
    command: node
    args:
      - /path/to/server.js
    env:
      LOG_LEVEL: info
    timeout: 30000

  - name: remote_server
    type: http
    url: https://api.example.com/mcp
    auth:
      type: bearer
      token: ${API_TOKEN}

profiles:
  default:
    servers:
      - local_server
  production:
    servers:
      - remote_server
```

## Validation Rules

### Required Fields

- `version`: Must be specified
- `servers`: Must be non-empty array
- Each server: `name`, `type`
- Stdio servers: `command`
- HTTP servers: `url`
- Bearer auth: `token`
- OAuth auth: `clientId`, `clientSecret`, `tokenUrl`

### Format Rules

- **Server names**: Must be unique alphanumeric + underscore/dash
  - Example: `my_server`, `prod-db`, `api123` ✅
  - Example: `my server`, `prod/db` ❌
- **Timeouts**: Positive number in milliseconds
  - Min: 1000 (1 second)
  - Max: 300000 (5 minutes)
- **URLs**: Must start with `https://` (HTTPS required)
  - Example: `https://api.example.com/mcp` ✅
  - Example: `http://api.example.com/mcp` ❌

## Error Cases

### Missing Required Field

```json
{
  "servers": [
    {
      "name": "incomplete"
      // Missing "type" field
    }
  ]
}
```

**Error:** `"type" is required`

### Invalid Server Type

```json
{
  "servers": [
    {
      "name": "bad_type",
      "type": "ftp", // Only "stdio" or "http" allowed
      "command": "..."
    }
  ]
}
```

**Error:** `"type" must be "stdio" or "http"`

### Missing URL for HTTP Server

```json
{
  "servers": [
    {
      "name": "api",
      "type": "http"
      // Missing "url" field
    }
  ]
}
```

**Error:** HTTP servers require `url` field

### Undefined Variable

```json
{
  "servers": [
    {
      "name": "api",
      "type": "http",
      "url": "${UNDEFINED_VAR}/mcp"
    }
  ]
}
```

If `UNDEFINED_VAR` is not set:

**Error:** `Environment variable UNDEFINED_VAR not defined`

## Next Steps

- 📖 **[CLI Commands](cli-commands.md)** — Command reference
- 🔐 **[Error Handling](errors.md)** — Error types
- 🔧 **[Configuration Guide](../guides/configuration.md)** — How-to guide
