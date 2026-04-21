# Authentication Flows

Understanding how authentication works in `mcpcli`.

## Bearer Token Flow

Simple static token authentication.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Agent
    participant mcpcli
    participant Config
    participant Auth
    participant API

    Agent->>mcpcli: mcp call api.tool '{}'
    mcpcli->>Config: Load configuration
    Config-->>mcpcli: servers[], auth config
    mcpcli->>Auth: Create BearerProvider(token)
    Auth-->>mcpcli: Provider instance
    Auth->>Auth: Get token from config<br/>or ${ENV_VAR}
    mcpcli->>API: HTTP request<br/>+ Authorization: Bearer <token>
    API-->>mcpcli: Tool response
    mcpcli-->>Agent: JSON result
```

### Implementation

```typescript
// Config
{
  "auth": {
    "type": "bearer",
    "token": "${API_TOKEN}"  // From env var or literal
  }
}

// Runtime
const provider = new BearerProvider(config.auth);
const token = await provider.getToken();  // Get from env or literal
// Later: HTTP headers include: Authorization: Bearer <token>
```

### Token Lifecycle

```
1. Load config
   ↓
2. Check ${VAR_NAME} substitution
   ↓
3. Store token (in memory for process lifetime)
   ↓
4. Add to HTTP headers for each request
   ↓
5. Never refresh (static token)
```

**Security notes:**

- Token validity is server's responsibility
- mcpcli doesn't validate token format
- Token passed as-is in Bearer header
- Never logged (except with --verbose + redacted intention)

---

## OAuth 2.0 Client Credentials Flow

Enterprise-grade automatic token management.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Agent
    participant mcpcli
    participant Config
    participant Auth
    participant TokenServer
    participant API

    Agent->>mcpcli: mcp call api.tool '{}'

    mcpcli->>Config: Load configuration
    Config-->>mcpcli: servers[], oauth config

    mcpcli->>Auth: Create OAuthProvider(config)

    Note over Auth: Token cache empty

    Auth->>TokenServer: POST /oauth/token<br/>client_id, client_secret,<br/>grant_type=client_credentials

    TokenServer->>TokenServer: Validate credentials
    TokenServer-->>Auth: access_token,<br/>expires_in: 3600

    Auth->>Auth: Cache token + expiry time

    mcpcli->>API: HTTP request<br/>+ Authorization: Bearer <token>
    API-->>mcpcli: Tool response

    mcpcli-->>Agent: JSON result

    Note over Auth: Token cached for ~30 minutes
```

### Token Refresh

```mermaid
sequenceDiagram
    participant mcpcli
    participant Auth
    participant TokenServer
    participant API

    Note over Auth: Token will expire in 10 minutes

    mcpcli->>Auth: getToken()

    Auth->>Auth: Check: 90% of lifetime elapsed?<br/>YES - need refresh

    Auth->>TokenServer: POST /oauth/token<br/>(refresh)

    TokenServer->>TokenServer: Validate credentials
    TokenServer-->>Auth: New token,<br/>expires_in: 3600

    Auth->>Auth: Update cache

    Auth-->>mcpcli: New token

    mcpcli->>API: HTTP request<br/>+ Authorization: Bearer <new_token>
    API-->>mcpcli: Tool response
```

### Implementation

```typescript
// Config
{
  "auth": {
    "type": "oauth",
    "clientId": "${CLIENT_ID}",
    "clientSecret": "${CLIENT_SECRET}",
    "tokenUrl": "https://auth.example.com/oauth/token",
    "scope": "mcp:read mcp:write",
    "audience": "https://api.example.com"
  }
}

// Runtime - Automatic
const provider = new OAuthProvider(config.auth);

// First call - exchanges credentials for token
const token1 = await provider.getToken();  // Calls token server

// Second call (within token lifetime) - returns cached token
const token2 = await provider.getToken();  // Returns cached, no call

// After 90% of lifetime - refreshes automatically
const token3 = await provider.getToken();  // Calls token server again
```

### Token Lifecycle

```
1. Load OAuth config (client_id, client_secret, token_url)
   ↓
2. First getToken() call
   ├─→ POST to token_url with credentials
   ├─→ Receive: access_token + expires_in (e.g., 3600 seconds)
   ├─→ Calculate refresh point: now + (3600 * 0.9) = refresh at 90%
   └─→ Cache token in memory
   ↓
3. Subsequent getToken() calls
   ├─→ If before refresh point: return cached token (instant)
   └─→ If past refresh point: go to step 2 (automatic refresh)
   ↓
4. Process ends or new invocation
   └─→ Token cache discarded (stateless, no persistence)
```

**Token refresh timing:**

- If token expires in 1 hour: Refresh after 54 minutes
- If token expires in 10 minutes: Refresh after 9 minutes
- Always refresh at 90% lifetime to be safe

---

## Authentication Selection

### How Auth Type Is Chosen

```
Config loaded
    ↓
auth.type === "bearer"  →  Use static token
auth.type === "oauth"   →  Use OAuth flow
auth.type === "none"    →  No authorization
missing                 →  No authorization (default)
```

### Runtime Selection

```typescript
// AuthFactory - Central dispatch
export class AuthFactory {
  static create(config: AuthConfig): AuthProvider {
    switch (config?.type) {
      case "bearer":
        return new BearerProvider(config);
      case "oauth":
        return new OAuthProvider(config);
      default:
        return new NoAuthProvider(); // No auth
    }
  }
}

// Usage
const provider = AuthFactory.create(serverConfig.auth);
const token = await provider.getToken();
```

---

## Environment Variable Substitution

Both bearer and OAuth support env var substitution.

### Bearer Token Example

```json
{
  "auth": {
    "type": "bearer",
    "token": "${MY_API_TOKEN}"
  }
}
```

```bash
export MY_API_TOKEN="sk_live_123456789"
mcp call api.tool '{}' # Token substituted
```

### OAuth Example

```json
{
  "auth": {
    "type": "oauth",
    "clientId": "${OAUTH_CLIENT_ID}",
    "clientSecret": "${OAUTH_CLIENT_SECRET}",
    "tokenUrl": "${OAUTH_TOKEN_URL}"
  }
}
```

```bash
export OAUTH_CLIENT_ID="myclient"
export OAUTH_CLIENT_SECRET="mysecret"
export OAUTH_TOKEN_URL="https://auth.example.com/token"
mcp call api.tool '{}' # All values substituted
```

### Why Environment Variables?

1. **Security** - Secrets not in config file
2. **Flexibility** - Different values per environment
3. **CI/CD** - Secrets injected at runtime
4. **Best practice** - Industry standard

---

## HTTP Header Format

### Bearer Token

```
Authorization: Bearer <token>
```

Example:

```
Authorization: Bearer sk_live_abc123xyz789
```

### OAuth Token

Same format as bearer (Bearer tokens are standard):

```
Authorization: Bearer <access_token>
```

Example:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Additional Headers

Both auth types may add additional headers if specified:

```json
{
  "auth": {
    "type": "oauth",
    "clientId": "...",
    "clientSecret": "...",
    "tokenUrl": "https://...",
    "scope": "mcp:read mcp:write", // Sent in token request
    "audience": "https://api.example.com" // Sent in token request
  }
}
```

---

## Error Handling

### Invalid Token (Bearer)

```
GET /mcp
Authorization: Bearer invalid_token

Response: 401 Unauthorized
Error: "Authentication failed"
```

**How mcpcli handles:**

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "Authentication failed",
    "details": {
      "reason": "HTTP 401 Unauthorized"
    }
  }
}
```

### Invalid Credentials (OAuth)

```
POST /oauth/token
client_id=wrong_id
client_secret=wrong_secret

Response: 401 Unauthorized
```

**How mcpcli handles:**

```json
{
  "success": false,
  "error": {
    "type": "connection",
    "message": "OAuth token exchange failed",
    "details": {
      "reason": "Invalid client credentials"
    }
  }
}
```

### Missing Environment Variable

```json
{
  "auth": {
    "token": "${MISSING_VAR}"
  }
}
```

```bash
mcp list
# Error: Environment variable MISSING_VAR not defined
```

---

## Security Considerations

### Token Exposure

**Risk:** Token logged or exposed

**Mitigations:**

1. Never hardcode tokens in config (must use ${VAR})
2. Tokens in environment, not files
3. --verbose logs don't include actual token values
4. Each process independent (no persistence)
5. Tokens not cached to disk

### Token Rotation

**Bearer tokens:**

- Rotate when compromised
- Update environment variable
- Next mcpcli call uses new token

**OAuth tokens:**

- Server rotates automatically (based on expires_in)
- mcpcli refreshes at 90% lifetime
- No manual rotation needed

### HTTPS Requirement

**Rule:** Remote servers (HTTP type) must use HTTPS.

**Why:**

- Prevents token interception
- HTTP would expose token in transit
- HTTPS required for production

**Enforced:**

```json
{
  "type": "http",
  "url": "http://api.example.com"  // ❌ Will fail
}

{
  "type": "http",
  "url": "https://api.example.com"  // ✅ OK
}
```

### Certificate Validation

Self-signed certificates:

- Rejected by default (security)
- Warning: "SSL validation failed"
- Solution: Use proper certificate

---

## Multi-Server Authentication

Each server can have different auth:

```json
{
  "servers": [
    {
      "name": "internal_api",
      "type": "http",
      "url": "https://internal.company.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "${INTERNAL_TOKEN}"
      }
    },
    {
      "name": "public_api",
      "type": "http",
      "url": "https://public.example.com/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "${PUBLIC_CLIENT_ID}",
        "clientSecret": "${PUBLIC_CLIENT_SECRET}",
        "tokenUrl": "https://auth.example.com/token"
      }
    },
    {
      "name": "local_server",
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/server.js"]
      // No auth for local stdio
    }
  ]
}
```

---

## Debugging Authentication

### Enable Verbose Logging

```bash
mcp call api.tool '{}' --verbose
```

Logs show:

- Which auth type is being used
- Token exchange details (OAuth)
- HTTP headers being sent
- Response status codes

### Check Token

```bash
# Bearer token
echo $MY_API_TOKEN

# OAuth - token generated after first call
mcp call api.tool '{}' --verbose 2>&1 | grep -i "token"
```

### Test Configuration

```bash
# Verify server is accessible
curl https://api.example.com/mcp

# Test with bearer token
curl -H "Authorization: Bearer $MY_API_TOKEN" https://api.example.com/mcp

# Test OAuth manually
curl -X POST https://auth.example.com/token \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

---

## Next Steps

- 🔐 **[Bearer Tokens Guide](../guides/auth-bearer.md)** — How-to for bearer tokens
- 🔐 **[OAuth Guide](../guides/auth-oauth.md)** — How-to for OAuth
- 🏗️ **[Architecture](architecture.md)** — System design
