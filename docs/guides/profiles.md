# Using Profiles

Learn how profiles help you manage different sets of MCP servers for different environments and use cases.

## What Are Profiles?

Profiles let you group servers into logical sets. Instead of configuring different files for dev, staging, and production, you define everything in one config and switch between profiles.

## Basic Profile Setup

Create profiles in your configuration:

```json
{
  "version": "1.0.0",
  "servers": [
    { "name": "db_prod", "type": "stdio", "command": "..." },
    { "name": "db_staging", "type": "stdio", "command": "..." },
    { "name": "api_prod", "type": "http", "url": "..." },
    { "name": "api_staging", "type": "http", "url": "..." }
  ],
  "profiles": {
    "production": {
      "servers": ["db_prod", "api_prod"]
    },
    "staging": {
      "servers": ["db_staging", "api_staging"]
    },
    "default": {
      "servers": ["db_staging", "api_staging"]
    }
  }
}
```

## Using Profiles

Use a profile with the `--profile` flag:

```bash
# Use production profile (only prod servers)
$ mcp list --profile=production
$ mcp call db_prod.read_file '{}' --profile=production

# Use staging profile (only staging servers)
$ mcp list --profile=staging
$ mcp call db_staging.read_file '{}' --profile=staging

# Use default profile (if not specified)
$ mcp list
```

## Common Profile Patterns

### Environment-Based Profiles (Recommended)

```json
{
  "servers": [
    { "name": "database", "type": "http", "url": "https://prod-db.com" },
    { "name": "database_staging", "type": "http", "url": "https://staging-db.com" },
    { "name": "database_dev", "type": "http", "url": "https://localhost:3000" }
  ],
  "profiles": {
    "prod": { "servers": ["database"] },
    "staging": { "servers": ["database_staging"] },
    "dev": { "servers": ["database_dev"] },
    "default": { "servers": ["database_dev"] }
  }
}
```

Use:

```bash
mcp list --profile=prod
mcp list --profile=staging
mcp list  # Uses dev (default)
```

### Role-Based Profiles

```json
{
  "servers": [
    { "name": "read_only_db", ... },
    { "name": "admin_db", ... },
    { "name": "backup_db", ... }
  ],
  "profiles": {
    "viewer": { "servers": ["read_only_db"] },
    "admin": { "servers": ["read_only_db", "admin_db"] },
    "dba": { "servers": ["read_only_db", "admin_db", "backup_db"] }
  }
}
```

Use:

```bash
# As a regular user, only see read-only tools
mcp list --profile=viewer

# As admin, see more tools
mcp list --profile=admin
```

### Feature-Based Profiles

```json
{
  "servers": [
    { "name": "analytics", ... },
    { "name": "reporting", ... },
    { "name": "billing", ... },
    { "name": "auth", ... }
  ],
  "profiles": {
    "analytics": { "servers": ["analytics", "reporting"] },
    "finance": { "servers": ["billing", "reporting"] },
    "security": { "servers": ["auth"] },
    "all": { "servers": ["analytics", "reporting", "billing", "auth"] }
  }
}
```

Use:

```bash
# Discover analytics tools
mcp list --profile=analytics

# Discover finance tools
mcp list --profile=finance
```

### Testing Profiles

```json
{
  "servers": [
    { "name": "test_db", ... },
    { "name": "test_cache", ... },
    { "name": "test_queue", ... },
    { "name": "prod_db", ... }
  ],
  "profiles": {
    "unit": { "servers": ["test_db"] },
    "integration": { "servers": ["test_db", "test_cache", "test_queue"] },
    "e2e": { "servers": ["test_db", "test_cache", "test_queue", "prod_db"] },
    "default": { "servers": ["test_db", "test_cache", "test_queue"] }
  }
}
```

Use:

```bash
# Run unit tests (only test DB)
npm test -- --profile=unit

# Run integration tests (with cache and queue)
npm test -- --profile=integration

# Run e2E tests (with prod DB)
npm test -- --profile=e2e
```

## Default Profile

If you don't specify a profile, `mcpcli` uses the `"default"` profile:

```json
{
  "profiles": {
    "default": {
      "servers": ["staging_db", "staging_api"]
    },
    "prod": {
      "servers": ["prod_db", "prod_api"]
    }
  }
}
```

```bash
mcp list  # Uses 'default' profile
```

If no `"default"` profile exists, **all servers** are used.

## Complete Example

Full configuration with multiple profiles:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "prod_database",
      "type": "http",
      "url": "https://db.prod.company.com/mcp",
      "auth": { "type": "bearer", "token": "${PROD_DB_TOKEN}" }
    },
    {
      "name": "staging_database",
      "type": "http",
      "url": "https://db.staging.company.com/mcp",
      "auth": { "type": "bearer", "token": "${STAGING_DB_TOKEN}" }
    },
    {
      "name": "dev_database",
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/local-db.js"]
    },
    {
      "name": "prod_api",
      "type": "http",
      "url": "https://api.prod.company.com/mcp",
      "auth": { "type": "oauth", "clientId": "${PROD_API_ID}", ... }
    },
    {
      "name": "staging_api",
      "type": "http",
      "url": "https://api.staging.company.com/mcp",
      "auth": { "type": "oauth", "clientId": "${STAGING_API_ID}", ... }
    }
  ],
  "profiles": {
    "production": {
      "servers": ["prod_database", "prod_api"]
    },
    "staging": {
      "servers": ["staging_database", "staging_api"]
    },
    "development": {
      "servers": ["dev_database"]
    },
    "all": {
      "servers": ["prod_database", "staging_database", "dev_database", "prod_api", "staging_api"]
    },
    "default": {
      "servers": ["staging_database", "staging_api"]
    }
  }
}
```

Usage:

```bash
# Production work
mcp list --profile=production
mcp call prod_database.query '{}' --profile=production

# Staging development
mcp list --profile=staging
mcp call staging_database.query '{}' --profile=staging

# Local development
mcp list --profile=development
mcp call dev_database.query '{}' --profile=development

# All servers (testing)
mcp list --profile=all

# Default (staging)
mcp list
```

## Profile in Scripts

Use profiles in scripts and automation:

```bash
# build.sh
#!/bin/bash

ENV=${1:-staging}  # Default to staging

echo "Building for $ENV environment..."

# Discover tools for this environment
tools=$(mcp list --profile=$ENV | jq '.aggregated.tools | length')
echo "Found $tools tools"

# Execute setup tool
mcp call setup.initialize '{}' --profile=$ENV
echo "Environment initialized"
```

Run with different profiles:

```bash
./build.sh staging      # Uses staging profile
./build.sh production   # Uses production profile
./build.sh              # Uses staging (default)
```

## Switching Profiles in CI/CD

Use profiles to run different tasks per environment:

=== "GitHub Actions"

    ```yaml
    - name: Run tests (staging)
      run: mcp call test.run '{}' --profile=staging

    - name: Deploy (production)
      if: github.ref == 'refs/heads/main'
      run: mcp call deploy.start '{}' --profile=production
    ```

=== "GitLab CI"

    ```yaml
    test_staging:
      script:
        - mcp call test.run '{}' --profile=staging

    deploy_production:
      script:
        - mcp call deploy.start '{}' --profile=production
      only:
        - main
    ```

=== "Jenkins"

    ```groovy
    stage('Test') {
      steps {
        sh 'mcp call test.run "{}" --profile=staging'
      }
    }

    stage('Deploy (Prod)') {
      when { branch 'main' }
      steps {
        sh 'mcp call deploy.start "{}" --profile=production'
      }
    }
    ```

## Tips & Best Practices

### 1. Always Have a Default Profile

```json
{
  "profiles": {
    "default": {
      "servers": ["staging_db", "staging_api"]
    }
  }
}
```

### 2. Be Explicit with Environment Variables

```json
{
  "profiles": {
    "production": {
      "servers": ["prod_db"]
    },
    "staging": {
      "servers": ["staging_db"]
    }
  }
}
```

Use environment variable prefixes:

```bash
export PROD_DB_TOKEN="..."
export STAGING_DB_TOKEN="..."
mcp list --profile=production
```

### 3. Document Your Profiles

```json
{
  "profiles": {
    "production": {
      "description": "Production environment - restricted access",
      "servers": ["prod_db"]
    },
    "staging": {
      "description": "Staging environment - for QA testing",
      "servers": ["staging_db"]
    }
  }
}
```

Include a README explaining each profile:

```markdown
## Available Profiles

- **production:** Production servers (restricted)
- **staging:** Staging servers (for QA)
- **development:** Local development servers
```

### 4. Use Descriptive Server Names

```json
{
  "servers": [
    { "name": "postgres_prod_primary", ... },      // Clear!
    { "name": "db", ... }                          // Unclear
  ]
}
```

### 5. Version Your Profiles

When profiles change, update documentation:

```json
{
  "version": "1.0.0",  // Update when profiles change
  "profiles": { ... }
}
```

Document in your config comment or README:

```markdown
## Configuration Version History

- v1.0.0: Initial setup with prod/staging/dev
- v1.1.0: Added feature-based profiles
```

## Troubleshooting

### "Profile not found"

**Problem:** Getting error "Profile not found"

**Solution:**

1. Check profile name in config
2. Use exact spelling (case-sensitive)
3. Verify profile exists in config file
4. Run `mcp list --verbose` to see available profiles

### "No servers in profile"

**Problem:** Profile has no servers returning

**Solution:**

1. Verify servers in the profile are configured
2. Check server names exactly match
3. Ensure servers are available/running
4. Try different profile

### Wrong Profile Used

**Problem:** You specified a profile but wrong servers were used

**Solution:**

1. Double-check the profile name
2. Verify config file saved correctly
3. Try explicit profile: use full `--profile=name` flag
4. Check for typos in config

## Next Steps

- 🔧 **[Configuration](configuration.md)** — Full config reference
- 🔐 **[Authentication](auth-bearer.md)** — Secure different profiles
- 📖 **[CLI Reference](../reference/cli-commands.md)** — All commands
