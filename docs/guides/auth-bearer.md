# Bearer Token Authentication

Configure static bearer tokens for MCP servers.

## When to Use Bearer Tokens

Use bearer tokens when:

- You have a **static API key** or token
- The token **doesn't expire** or expires infrequently
- You're integrating with **simple REST APIs**
- You want **minimal setup** with no refresh logic

For tokens that expire and need refresh, use **[OAuth 2.0](auth-oauth.md)** instead.

## Quick Start

Add a `auth` section to your server configuration:

```json
{
  "servers": [
    {
      "name": "my_api",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "sk_live_123456789abcdef"
      }
    }
  ]
}
```

Now when you use `mcpcli`, the bearer token is automatically sent:

```bash
$ mcp list
```

HTTP header sent:

```
Authorization: Bearer sk_live_123456789abcdef
```

## Using Environment Variables

**Never hardcode tokens in your config file.** Use environment variables:

```json
{
  "servers": [
    {
      "name": "secure_api",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${API_TOKEN}"
      }
    }
  ]
}
```

Then set the environment variable:

```bash
# Linux/macOS
export API_TOKEN="sk_live_123456789abcdef"
mcp list

# Windows PowerShell
$env:API_TOKEN = "sk_live_123456789abcdef"
mcp list

# Windows Command Prompt
set API_TOKEN=sk_live_123456789abcdef
mcp list
```

**Best practice:** Store tokens in a `.env` file (git-ignored):

```bash
# .env file (add to .gitignore!)
API_TOKEN=sk_live_123456789abcdef
```

Load before using:

```bash
source .env  # Linux/macOS
# or
$env_file = Get-Content .env | ConvertFrom-StringData
$env_file.Keys | ForEach-Object { [Environment]::SetEnvironmentVariable($_, $env_file[$_]) }  # PowerShell
```

## Multiple Servers with Different Tokens

```json
{
  "servers": [
    {
      "name": "api_prod",
      "type": "http",
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${PROD_API_TOKEN}"
      }
    },
    {
      "name": "api_staging",
      "type": "http",
      "url": "https://staging-api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${STAGING_API_TOKEN}"
      }
    }
  ]
}
```

Set different tokens:

```bash
export PROD_API_TOKEN="sk_live_prod_..."
export STAGING_API_TOKEN="sk_live_staging_..."
mcp list
```

## Complete Example

Production-ready setup with security best practices:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "database_service",
      "type": "http",
      "url": "https://db.internal.company.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${DB_SERVICE_TOKEN}"
      },
      "timeout": 30000
    },
    {
      "name": "analytics_service",
      "type": "http",
      "url": "https://analytics.company.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${ANALYTICS_TOKEN}"
      },
      "timeout": 15000
    }
  ],
  "profiles": {
    "production": {
      "servers": ["database_service", "analytics_service"]
    }
  }
}
```

**Environment variables (.env):**

```
DB_SERVICE_TOKEN=sk_db_service_abc123xyz...
ANALYTICS_TOKEN=sk_analytics_def456uvw...
```

## HTTP Header Format

mcpcli automatically formats as:

```
Authorization: Bearer <token>
```

So if your token is `secret123`, the header becomes:

```
Authorization: Bearer secret123
```

Some APIs may expect different formats. Check your API documentation.

## Testing Your Token

Verify your token works:

```bash
$ mcp list --verbose
```

If successful, you'll see in debug output:

```
[INFO] Successfully connected to server
```

If the token is invalid:

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Authentication failed: Invalid token"
  }
}
```

## Common Issues

### Token Not Being Sent

**Problem:** You see "Unauthorized" errors even though you added auth config.

**Solution:** Verify environment variable is set:

```bash
echo $API_TOKEN  # Check if variable exists
```

If empty, export it first:

```bash
export API_TOKEN="your_token_here"
```

### Invalid Token Error

**Problem:** You get authentication failures.

**Solution:**

1. Verify the token is correct (check for typos)
2. Verify the token hasn't expired
3. Check API documentation for token format
4. Ensure the token has required permissions

### Token Exposed in Logs

**Problem:** Your token appears in verbose output.

**Solution:** This is intentional for debugging. Don't share logs containing tokens. If exposed:

1. Rotate the token immediately
2. Use new token in config
3. Check if token was misused

## Security Best Practices

1. ✅ **Store tokens in environment variables**

   ```json
   "token": "${API_TOKEN}"
   ```

2. ✅ **Add config to `.gitignore`**

   ```
   ~/.mcp/mcp.json
   .env
   ```

3. ✅ **Use HTTPS for remote servers**

   ```json
   "url": "https://api.example.com/mcp"
   ```

   Not:

   ```json
   "url": "http://api.example.com/mcp"
   ```

4. ✅ **Rotate tokens periodically**
   - Set a calendar reminder to rotate tokens
   - Update environment variables
   - Monitor token usage

5. ✅ **Use least privilege tokens**
   - Request tokens with minimal required permissions
   - Request tokens scoped to specific resources

6. ❌ **Never:**
   - Hardcode tokens in version control
   - Share tokens via email or chat
   - Use the same token for dev/prod
   - Log sensitive token values

## Local Development

For local stdio servers (that don't need auth):

```json
{
  "servers": [
    {
      "name": "local_dev",
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/local-server.js"]
    }
  ]
}
```

No `auth` field needed— stdio servers typically don't use HTTP authentication.

## Next Steps

- 🔐 **[OAuth 2.0](auth-oauth.md)** — For tokens that expire
- 🔧 **[Configuration](configuration.md)** — More config options
- 📖 **[Reference](../reference/cli-commands.md)** — All CLI commands
