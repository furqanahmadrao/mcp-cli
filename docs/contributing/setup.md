# Development Setup

Complete guide to setting up the development environment for `mcpcli`.

## System Requirements

- **Node.js:** 18.0.0 or later
- **npm:** 8.0.0 or later
- **Git:** Any recent version
- **Text Editor:** VS Code recommended
- **OS:** Windows, macOS, or Linux

## Step 1: Clone the Repository

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mcp-cli.git
cd mcp-cli

# Add upstream remote
git remote add upstream https://github.com/yourusername/mcp-cli.git

# Verify remotes
git remote -v
# origin    https://github.com/YOUR_USERNAME/mcp-cli.git (fetch)
# origin    https://github.com/YOUR_USERNAME/mcp-cli.git (push)
# upstream  https://github.com/yourusername/mcp-cli.git (fetch)
# upstream  https://github.com/yourusername/mcp-cli.git (push)
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs:

- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **commander** - CLI framework
- **zod** - Configuration validation
- **yaml** - YAML parsing
- **chalk** - Colored terminal output
- **typescript** - Type checking
- **vitest** - Testing framework
- **eslint** - Code linting
- **prettier** - Code formatting

**Verify installation:**

```bash
npm list  # Shows all installed packages
```

## Step 3: Verify Setup

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Check linting
npm run lint

# Check formatting
npm run format
```

All should pass without errors ✅

## Project Structure

```
mcp-cli/
├── src/                          # TypeScript source code
│   ├── cli/
│   │   ├── cli.ts               # Main entry point
│   │   ├── commands/            # Command definitions
│   │   │   ├── list.ts
│   │   │   └── call.ts
│   │   └── handlers/            # Command handlers
│   │       ├── discovery.ts
│   │       └── execution.ts
│   ├── gateway/                 # MCP client management
│   │   ├── coordinator.ts
│   │   └── tool-registry.ts
│   ├── config/                  # Configuration system
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   └── loader.ts
│   ├── auth/                    # Authentication
│   │   ├── bearer-provider.ts
│   │   ├── oauth-provider.ts
│   │   └── auth-factory.ts
│   ├── errors/                  # Error handling
│   │   ├── custom-errors.ts
│   │   └── error-formatter.ts
│   ├── output/                  # Output formatting
│   │   ├── formatters.ts
│   │   └── retry.ts
│   └── index.ts                 # Public exports
│
├── tests/                        # Test files
│   ├── unit/                    # Unit tests
│   │   ├── auth/
│   │   ├── cli/
│   │   ├── config/
│   │   └── ...
│   └── integration/             # Integration tests
│
├── dist/                        # Compiled JavaScript (after build)
├── docs/                        # Documentation
├── config/                      # Example configurations
├── package.json                 # Project metadata
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Unit test configuration
├── vitest.integration.config.ts # Integration test configuration
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

## NPM Scripts

| Command                    | Purpose                          |
| -------------------------- | -------------------------------- |
| `npm run build`            | Compile TypeScript to JavaScript |
| `npm run watch`            | Watch mode (recompile on change) |
| `npm test`                 | Run unit tests                   |
| `npm run test:integration` | Run integration tests            |
| `npm run lint`             | Check code style with ESLint     |
| `npm run format`           | Auto-format code with Prettier   |
| `npm run dev`              | Run from source with tsx         |
| `npm run prepublishOnly`   | Run before publishing to npm     |

## Development Workflow

### 1. Make Your Changes

Edit files in `src/`:

```typescript
// src/auth/new-feature.ts
export function myFeature(param: string): string {
  return `Hello ${param}`;
}
```

### 2. Run in Development

Test without building:

```bash
# Run from source (uses tsx)
npm run dev list
npm run dev call tool '{"param":"value"}'
```

### 3. Format Code

Auto-format before committing:

```bash
npm run format

# Check what would change (don't apply)
npx prettier --check src/
```

### 4. Lint Code

Check for issues:

```bash
npm run lint

# Fix auto-fixable issues
npx eslint src/ --fix
```

### 5. Write Tests

Create test file `tests/unit/auth/new-feature.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { myFeature } from "src/auth/new-feature";

describe("myFeature", () => {
  it("should greet with parameter", () => {
    const result = myFeature("Alice");
    expect(result).toBe("Hello Alice");
  });
});
```

Run tests:

```bash
npm test
npm test -- --watch  # Watch mode
npm test -- myFeature  # Run specific test
```

### 6. Build for Release

```bash
npm run build

# Verify dist/ folder created with JavaScript
ls dist/
```

### 7. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

## IDE Setup: VS Code

### Recommended Extensions

1. **ESLint** - `dbaeumer.vscode-eslint`
2. **Prettier** - `esbenp.prettier-vscode`
3. **TypeScript Vue Plugin** - `Vue.vscode-typescript-vue-plugin`

### Settings (`.vscode/settings.json`)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "typescript"],
  "eslint.autoFixOnSave": true
}
```

### Debugging

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Local Configuration for Testing

Create `~/.mcp/mcp.json` for local testing:

```json
{
  "version": "1.0.0",
  "servers": [
    {
      "name": "local_test",
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/test-server.js"],
      "timeout": 30000
    }
  ]
}
```

Create a test server `test-server.js`:

```javascript
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.on("line", (line) => {
  const message = JSON.parse(line);

  if (message.method === "initialize") {
    console.log(
      JSON.stringify({
        protocolVersion: "2024-11-05",
        capabilities: {},
        serverInfo: { name: "test", version: "1.0.0" },
      })
    );
  } else if (message.method === "tools/list") {
    console.log(
      JSON.stringify({
        tools: [
          {
            name: "test_tool",
            description: "A test tool",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      })
    );
  } else if (message.method === "tools/call") {
    console.log(
      JSON.stringify({
        content: [{ type: "text", text: "Tool executed" }],
      })
    );
  }
});
```

Test with:

```bash
mcp list              # Discover tools
mcp call local_test.test_tool '{}'  # Execute tool
```

## Testing with Different Configurations

### Test Bearer Token Auth

```bash
export TEST_API_TOKEN="test_token_123"

# Config using env var
{
  "auth": {
    "type": "bearer",
    "token": "${TEST_API_TOKEN}"
  }
}

mcp list  # Uses token from env
```

### Test OAuth

Set env vars:

```bash
export OAUTH_CLIENT_ID="test_client"
export OAUTH_CLIENT_SECRET="test_secret"
export OAUTH_TOKEN_URL="https://mock-auth.example.com/token"
```

### Test Multiple Servers

Edit `~/.mcp/mcp.json`:

```json
{
  "servers": [
    { "name": "server1", "type": "stdio", "command": "node", "args": ["server1.js"] },
    { "name": "server2", "type": "stdio", "command": "node", "args": ["server2.js"] }
  ]
}
```

Both servers must be running:

```bash
# Terminal 1
node server1.js

# Terminal 2
node server2.js

# Terminal 3
mcp list  # Discovers from both
```

## Troubleshooting Setup

### "npm: command not found"

Install Node.js from https://nodejs.org/

### "Build fails with TypeScript errors"

```bash
# Check TypeScript version
npx tsc --version

# Rebuild
npm run build
```

### "Tests fail"

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test tests/unit/auth/bearer-provider.test.ts
```

### "lint/format disagreement"

```bash
# Format first, then lint
npm run format
npm run lint

# Usually this resolves conflicts
```

### "Installed packages from older commit"

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- 📖 **[Contributing Guide](index.md)** — How to contribute
- 🔄 **[Pull Request Process](#)** — Create a PR
- 📝 **[Code of Conduct](#)** — Community guidelines

## Getting Help

- **GitHub Issues** - Ask for help
- **GitHub Discussions** - Ask questions
- **Code Comments** - Ask in PR comments
- **Slack/Discord** - Community chat (if available)
