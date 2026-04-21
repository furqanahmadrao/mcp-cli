# Configuration Guide

Complete reference for configuring `mcpcli` servers, authentication, and profiles.

## Configuration File

**Location:** `~/.mcp/mcp.json` (or `.yaml`/`.yml`)

Create this file with your servers and settings.

## Basic Structure

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "server_name",
      "type": "stdio|http",
      "command": "...",
      "timeout": 30000,
      "auth": { ... }
    }
  ],
  "profiles": {
    "default": { "servers": [...] }
  }
}
```

## Server Types

### Stdio Servers (Local)

For locally running MCP servers via standard input/output:

```json
{
  "name": "local_server",
  "type": "stdio",
  "command": "node",
  "args": ["/path/to/server.js"],
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "false"
  },
  "timeout": 30000
}
```

**Fields:**

- `name` (required): Unique identifier for this server
- `type` (required): Must be `"stdio"`
- `command` (required): Executable to run (e.g., `node`, `python`, `ruby`)
- `args` (optional): Array of command-line arguments
- `env` (optional): Environment variables to set for the process
- `timeout` (optional): Max time in milliseconds to wait for responses (default: 30000)

**Examples:**

=== "Node.js"

    ```json
    {
      "name": "nodejs_server",
      "type": "stdio",
      "command": "node",
      "args": ["/home/user/mcp-servers/node-mcp.js"],
      "env": { "DEBUG": "true" }
    }
    ```

=== "Python"

    ```json
    {
      "name": "python_server",
      "type": "stdio",
      "command": "python3",
      "args": ["/home/user/mcp-servers/python_mcp.py"],
      "env": { "PYTHONUNBUFFERED": "1" }
    }
    ```

=== "Go"

    ```json
    {
      "name": "go_server",
      "type": "stdio",
      "command": "/usr/local/bin/mcp-server",
      "args": ["--config", "/etc/mcp-config.yml"]
    }
    ```

### HTTP Servers (Remote)

For MCP servers exposed via HTTP:

```json
{
  "name": "remote_api",
  "type": "http",
  "url": "https://api.example.com/mcp",
  "auth": {
    "type": "bearer",
    "token": "${API_TOKEN}"
  },
  "timeout": 30000
}
```

**Fields:**

- `name` (required): Unique identifier
- `type` (required): Must be `"http"`
- `url` (required): Full URL to MCP endpoint
- `auth` (optional): Authentication configuration
- `timeout` (optional): Request timeout in milliseconds

**Examples:**

=== "Without Authentication"

    ```json
    {
      "name": "public_api",
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
    ```

=== "With Bearer Token"

    ```json
    {
      "name": "protected_api",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "sk_live_123456789"
      }
    }
    ```

=== "With OAuth"

    ```json
    {
      "name": "oauth_server",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "${OAUTH_CLIENT_ID}",
        "clientSecret": "${OAUTH_CLIENT_SECRET}",
        "tokenUrl": "https://auth.example.com/oauth/token"
      }
    }
    ```

## Authentication

See dedicated guides for authentication:

- **[Bearer Tokens](auth-bearer.md)** — Simple static tokens
- **[OAuth 2.0](auth-oauth.md)** — Client credentials flow

## Environment Variable Substitution

Reference environment variables in your config using `${VAR_NAME}`:

```json
{
  "servers": [
    {
      "name": "secure_server",
      "type": "http",
      "url": "${MCP_SERVER_URL}",
      "auth": {
        "type": "bearer",
        "token": "${MCP_API_TOKEN}"
      }
    }
  ]
}
```

**Usage:**

```bash
export MCP_SERVER_URL="https://api.example.com/mcp"
export MCP_API_TOKEN="sk_live_123456789"
mcp list
```

**Benefits:**

- Keep secrets out of version control
- Use different values per environment (dev/staging/prod)
- CI/CD integration

## Profiles

Group servers into profiles for different scenarios:

```json
{
  "servers": [
    { "name": "prod_db", "type": "stdio", "command": "..." },
    { "name": "prod_api", "type": "http", "url": "..." },
    { "name": "dev_local", "type": "stdio", "command": "..." }
  ],
  "profiles": {
    "production": {
      "servers": ["prod_db", "prod_api"]
    },
    "development": {
      "servers": ["dev_local"]
    },
    "full": {
      "servers": ["prod_db", "prod_api", "dev_local"]
    }
  }
}
```

**Use a profile:**

```bash
mcp list --profile=production
mcp call my_tool '{}' --profile=development
```

If no profile is specified, the `default` profile is used (or all servers if no default is defined).

## Timeouts

Control how long `mcpcli` waits for server responses:

```json
{
  "servers": [
    {
      "name": "slow_server",
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/server.js"],
      "timeout": 60000 // Wait up to 60 seconds
    },
    {
      "name": "fast_server",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "timeout": 5000 // Wait up to 5 seconds
    }
  ]
}
```

**Default:** 30000 milliseconds (30 seconds)

## Complete Example

A production-ready configuration:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "database",
      "type": "stdio",
      "command": "python3",
      "args": ["/opt/mcp/db-server.py", "--config=/etc/db-config.yml"],
      "env": {
        "LOG_LEVEL": "info"
      },
      "timeout": 60000
    },
    {
      "name": "api",
      "type": "http",
      "url": "https://api.internal.company.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${INTERNAL_API_KEY}"
      },
      "timeout": 10000
    },
    {
      "name": "external_service",
      "type": "http",
      "url": "https://external-service.com/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "${EXTERNAL_CLIENT_ID}",
        "clientSecret": "${EXTERNAL_CLIENT_SECRET}",
        "tokenUrl": "https://auth.external-service.com/oauth/token"
      },
      "timeout": 30000
    }
  ],
  "profiles": {
    "default": {
      "servers": ["database", "api"]
    },
    "production": {
      "servers": ["database", "api", "external_service"]
    },
    "development": {
      "servers": ["database"]
    },
    "testing": {
      "servers": ["database"]
    }
  }
}
```

## YAML Format

Use `~/.mcp/mcp.yaml` instead of JSON:

```yaml
version: "1.0.0"

servers:
  - name: database
    type: stdio
    command: python3
    args:
      - /opt/mcp/db-server.py
    timeout: 60000

  - name: api
    type: http
    url: https://api.example.com/mcp
    auth:
      type: bearer
      token: ${API_TOKEN}

profiles:
  default:
    servers:
      - database
      - api
  prod:
    servers:
      - database
      - api
```

## Tips & Best Practices

### 1. Use Environment Variables for Secrets

```json
{
  "auth": {
    "token": "${MY_SECRET_TOKEN}"
  }
}
```

Never commit actual tokens to version control.

### 2. Organize Servers by Type

```json
{
  "servers": [
    { "name": "db_prod", ... },
    { "name": "db_staging", ... },
    { "name": "api_prod", ... },
    { "name": "api_staging", ... }
  ]
}
```

### 3. Use Descriptive Names

```json
{
  "name": "postgres_warehouse_prod" // Clear purpose
}
```

Not just:

```json
{
  "name": "db" // Vague
}
```

### 4. Set Appropriate Timeouts

```json
{
  "name": "slow_batch_processor",
  "timeout": 120000  // 2 minutes for heavy processing
},
{
  "name": "responsive_api",
  "timeout": 5000    // 5 seconds for fast APIs
}
```

### 5. Use Profiles for Environments

```json
{
  "profiles": {
    "dev": { "servers": ["local_server"] },
    "staging": { "servers": ["staging_server"] },
    "prod": { "servers": ["prod_server"] }
  }
}
```

## Troubleshooting

**Config not found**

- Ensure `~/.mcp/mcp.json` exists
- Check file path: `cat ~/.mcp/mcp.json` (macOS/Linux) or `type %USERPROFILE%\.mcp\mcp.json` (Windows)

**Invalid JSON**

- Validate at [jsonlint.com](https://jsonlint.com)
- Check for missing commas or quotes

**Environment variable not substituting**

- Verify the variable is set: `echo $VAR_NAME`
- Use correct format: `${VAR_NAME}`

**Connection timeout**

- Increase the `timeout` value
- Check if the server is actually running
- Check server logs for errors

## Next Steps

- 📖 **[Bearer Tokens](auth-bearer.md)** — Configure static tokens
- 🔐 **[OAuth 2.0](auth-oauth.md)** — Configure OAuth authentication
- 👉 **[Using Profiles](profiles.md)** — Deep dive into profiles
