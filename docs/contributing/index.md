# Contributing to mcpcli

Thank you for your interest in contributing to `mcpcli`! This guide explains how to get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- A GitHub account

### Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/mcp-cli.git
cd mcp-cli

# Add upstream remote
git remote add upstream https://github.com/yourusername/mcp-cli.git
```

### Setup Development Environment

```bash
# Install dependencies
npm install

# Verify build works
npm run build

# Run tests
npm test
```

## Development

### Project Structure

```
src/
├── cli/              - Command definitions
├── gateway/          - MCP client management
├── config/           - Configuration handling
├── auth/             - Authentication providers
├── errors/           - Error types and formatting
├── output/           - Output formatting
└── index.ts          - Public API

tests/                - Unit and integration tests
docs/                 - Documentation (Markdown)
config/               - Example configurations
```

### Making Changes

1. **Create a branch:**

   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bug-fix
   ```

2. **Code with linting:**

   ```bash
   npm run format  # Auto-fix formatting
   npm run lint    # Check for issues
   ```

3. **Write tests:**

   ```bash
   npm test  # Run all tests
   npm test -- --watch  # Watch mode
   ```

4. **Verify build:**
   ```bash
   npm run build
   ```

### Code Style

We follow:

- **ESLint** configuration (run `npm run lint`)
- **Prettier** formatting (run `npm run format`)
- **TypeScript** strict mode
- **Google Technical Writing** style for docs

### TypeScript Guidelines

```typescript
// ✅ Good
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

function createClient(config: ServerConfig): MCPClient {
  // Implementation
}

// ❌ Avoid
export interface Tool {
  n: string; // Unclear abbreviation
  desc: string;
}

function create(c: any) {
  // Any type, unclear parameters
  // Implementation
}
```

### Error Handling

Define new errors in `src/errors/custom-errors.ts`:

```typescript
export class ToolNotFoundError extends MCPError {
  constructor(toolName: string, available: string[]) {
    super("tool_not_found", `Tool not found: ${toolName}`, { requested: toolName, available });
  }
}
```

## Testing

### Unit Tests

Located in `tests/unit/`:

```typescript
import { describe, it, expect } from "vitest";
import { BearerProvider } from "src/auth/bearer-provider";

describe("BearerProvider", () => {
  it("should return token from config", async () => {
    const provider = new BearerProvider({ token: "test_token" });
    const token = await provider.getToken();
    expect(token).toBe("test_token");
  });
});
```

Run with:

```bash
npm test
```

### Integration Tests

Located in `tests/integration/`:

```typescript
import { describe, it, expect } from "vitest";
import { ToolRegistry } from "src/gateway/tool-registry";

describe("Tool Discovery (Integration)", () => {
  it("should discover tools from server", async () => {
    // Test with mock or real server
  });
});
```

Run with:

```bash
npm run test:integration
```

### Writing Good Tests

- **Test behavior, not implementation**

  ```typescript
  // ✅ Good - tests behavior
  expect(await provider.getToken()).toBe(expectedToken);

  // ❌ Bad - tests implementation detail
  expect(provider.token).toBe(value);
  ```

- **Use descriptive names**

  ```typescript
  // ✅ Good
  it("should refresh token when 90% of lifetime elapsed", () => {});

  // ❌ Bad
  it("should refresh", () => {});
  ```

- **Test happy path and errors**

  ```typescript
  // Happy path
  expect(result.success).toBe(true);

  // Error cases
  expect(() => fn()).toThrow(InvalidInputError);
  ```

- **Mock external services**
  ```typescript
  const mockServer = vi.fn()
    .mockResolvedValue({ tools: [...] });
  ```

## Documentation

### Writing Docs

Documentation lives in `docs/` and follows **Diátaxis framework**:

- **Tutorials** (`docs/tutorials/`) - Learning-oriented step-by-step guides
- **How-to Guides** (`docs/guides/`) - Problem-oriented recipes
- **Reference** (`docs/reference/`) - Dry, factual API docs
- **Explanation** (`docs/explanation/`) - Understanding-oriented articles

### Editing Docs

1. **Find or create the file**

   ```bash
   # Docs folder structure
   docs/
   ├── index.md
   ├── tutorials/
   ├── guides/
   ├── reference/
   └── explanation/
   ```

2. **Follow Google Technical Writing style**
   - Use active voice: "Click the button" (not "The button should be clicked")
   - Use second person: "You configure" (not "The user configures")
   - Use present tense: "Returns an error" (not "Will return")

3. **Include examples**

   ````markdown
   ### Configuring Bearer Tokens

   Create your auth configuration:

   ​`json
   {
     "auth": {
       "type": "bearer",
       "token": "${API_TOKEN}"
     }
   }
   ​`
   ````

4. **Use Mermaid diagrams**
   ````markdown
   ​`mermaid
   graph LR
     A[Input] --> B[Process] --> C[Output]
   ​`
   ````

### Deploying Docs

The documentation is built for GitHub Pages:

```bash
# Install MkDocs
pip install mkdocs mkdocs-material

# Serve locally
mkdocs serve

# Deploy to GitHub Pages
mkdocs gh-deploy
```

## Commit Messages

Follow conventional commits:

```
feat: add OAuth 2.0 support
fix: handle expired tokens correctly
docs: update authentication guide
test: add unit tests for bearer provider
refactor: extract auth logic to separate module
chore: update dependencies
```

**Format:**

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:** feat, fix, docs, test, refactor, chore, perf

## Pull Request Process

1. **Create a descriptive title**

   ```
   feat: add OAuth 2.0 token refresh
   fix: handle connection timeouts gracefully
   ```

2. **Provide context in description**

   ```markdown
   ## Description

   Adds automatic OAuth token refresh when approaching expiry.

   ## Changes

   - Implement 90% lifetime check for token refresh
   - Add exponential backoff for failed token exchanges
   - Add tests for OAuth flow

   ## Testing

   Tested with Auth0 and Azure AD OAuth endpoints.

   ## Screenshots/Demo

   [optional]
   ```

3. **Link related issues**

   ```markdown
   Fixes #123
   Related to #124
   ```

4. **Ensure checks pass**
   - ✅ Tests pass (`npm test`)
   - ✅ Lint passes (`npm run lint`)
   - ✅ Build succeeds (`npm run build`)
   - ✅ Docs build successfully (`mkdocs build`)

5. **Request review**
   - Link maintainers
   - Ping on discussions if urgent

## Architecture Decisions

For significant changes, document your decision:

### Format

```
# ADR 00X: [Brief Title]

## Context
[Problem and background]

## Decision
[Solution chosen]

## Consequences
[Pros and cons]
```

### Example

```markdown
# ADR 005: Use Parallel Server Discovery

## Context

When querying many servers (10+), sequential queries are slow.

## Decision

Query all servers concurrently using Promise.all().

## Consequences

- Much faster discovery (1s instead of 10s)
- Slightly more complex code
- Higher memory usage per discovery call
- Better user experience
```

## Building & Publishing

### Build Process

```bash
npm run build        # Compile TypeScript
npm run lint         # Check code style
npm test             # Run tests
npm run format       # Auto-format code
```

### Local Testing

```bash
# Build and test locally
npm run build

# Test the CLI
node dist/cli/cli.js list

# Or with npm link
npm link
mcp list  # Test globally
```

### Publishing to npm

(Maintainers only)

```bash
# Bump version in package.json
npm version patch  # or minor, major

# Build
npm run build

# Publish
npm publish

# Create GitHub release
git push --tags
```

## Getting Help

- **GitHub Issues** - Report bugs or request features
- **GitHub Discussions** - Ask questions
- **Pull Request Comments** - Discuss changes
- **Discord/Slack** (if available) - Real-time chat

## Code of Conduct

Be respectful, inclusive, and professional:

- ✅ Welcome beginners
- ✅ Be patient and helpful
- ✅ Accept constructive criticism
- ❌ No harassment or discrimination

## Recognition

Contributors will be:

- Added to CONTRIBUTORS.md
- Thanked in release notes
- Recognized in project README

## Common Tasks

### Add a New Auth Type

1. Create `src/auth/new-auth-provider.ts`
2. Implement `AuthProvider` interface
3. Add to `src/auth/auth-factory.ts` switch
4. Add tests in `tests/unit/auth/`
5. Document in `docs/guides/auth-*.md`

### Add a New Command

1. Create `src/cli/commands/new-command.ts`
2. Implement command handler
3. Register in `src/cli/cli.ts`
4. Add tests in `tests/unit/cli/commands/`
5. Document in `docs/reference/cli-commands.md`

### Fix a Bug

1. Create issue describing the bug
2. Create branch from that issue
3. Write test that reproduces the bug
4. Fix the bug
5. Ensure test passes
6. Create PR with "Fixes #123" reference

### Add Documentation

1. Create or edit `.md` file in `docs/`
2. Follow Diátaxis and Google style
3. Include examples and diagrams
4. Test links and code samples
5. Create PR with documentation changes

## Resources

- **TypeScript Handbook** - https://www.typescriptlang.org/docs/
- **Vitest Docs** - https://vitest.dev/
- **MCP Specification** - https://modelcontextprotocol.io/
- **Google Technical Writing** - https://developers.google.com/tech-writing
- **Conventional Commits** - https://www.conventionalcommits.org/

## Questions?

Feel free to:

- Open an issue with questions
- Ask in discussions
- Comment on relevant PRs
- Reach out to maintainers

Thank you for contributing! 🚀
