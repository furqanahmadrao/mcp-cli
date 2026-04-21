# Design Philosophy

Understanding the philosophy and principles behind `mcpcli`'s design.

## Core Principles

### 1. Stateless by Default

**Principle:** Each command invocation is completely independent.

**Why?**

- **Reliability:** No state to corrupt or leak
- **Concurrency:** Safe to run multiple commands in parallel
- **Simplicity:** No background process, no persistence layer
- **Testing:** Each run is predictable and reproducible

**Example:**

```bash
mcp list
mcp list  # Identical behavior, fresh discovery
mcp call tool '{}' &
mcp call tool '{}' &
wait  # Both run independently
```

**Trade-off:** Slight overhead (reconnection per call) for major reliability gain.

---

### 2. Configuration, Not Code

**Principle:** All server configuration through `~/.mcp/mcp.json`, not CLI flags or code.

**Why?**

- **Single source of truth:** One file defines all servers
- **Version control:** Config is code (can be versioned)
- **Reusability:** All commands see same configuration
- **Profile support:** Easy dev/prod switching

**Example:**

```bash
# ❌ Avoided: CLI flags
mcp call tool '{}'  --server=db --auth=oauth --token=...

# ✅ Chosen: Configuration file
# ~/.mcp/mcp.json defines everything
mcp call tool '{}'
```

**Trade-off:** Users must maintain config file vs. convenience of inline flags.

---

### 3. Parallel Discovery

**Principle:** Query all servers simultaneously, abort slowest if timeout.

**Why?**

- **Performance:** 10 servers ≈ time of 1 server (parallel)
- **User experience:** Fast feedback
- **Real-world:** Servers are independent, should be queried independently
- **Scalability:** Adding servers doesn't linearly increase time

**Example:**

```
Sequential (❌ old way):
Server 1 (500ms) → Server 2 (300ms) → Server 3 (900ms) = 1700ms

Parallel (✅ current):
Server 1 (500ms)
Server 2 (300ms)  } Max = 900ms
Server 3 (900ms)
```

**Trade-off:** Slightly more complex code for dramatically better performance.

---

### 4. Explicit Over Implicit

**Principle:** Be clear about what's happening; avoid magic.

**Why?**

- **Debuggability:** Easy to understand what happened
- **Predictability:** Behavior is obvious
- **Agent-friendly:** LLMs can reason about explicit behavior
- **Safety:** No surprises

**Examples:**

=== "Tool Namespacing"

    ✅ Explicit:
    ```bash
    mcp call database.query '{}' # Clear which server
    ```

    ❌ Implicit:
    ```bash
    mcp call query '{}' # Which server? Guessing...
    ```

=== "Error Messages"

    ✅ Explicit:
    ```json
    {
      "error": {
        "type": "tool_not_found",
        "message": "Tool not found: read_file",
        "details": {
          "available": ["database.read_file", "api.query"]
        }
      }
    }
    ```

    ❌ Implicit:
    ```json
    {
      "error": "Tool not found"
    }
    ```

**Trade-off:** More verbose output and commands vs. clarity and debuggability.

---

### 5. JSON All the Way

**Principle:** Input and output is always JSON; structure for machine parsing.

**Why?**

- **Agent-friendly:** Perfect for LLM tool parsing
- **Composable:** Can pipe to `jq`, `grep`, other tools
- **Standardized:** JSON is universal
- **Debuggable:** Human-readable (with `jq` formatting)

**Example:**

```bash
# Input: JSON
mcp call tool '{"param":"value"}'

# Output: JSON
{
  "success": true,
  "result": {...}
}

# Compose with other tools
mcp list | jq '.aggregated.tools | length'
```

**Trade-off:** Must validate JSON carefully vs. flexibility and compatibility.

---

### 6. Security by Default

**Principle:** Make secure practices the default path.

**Why?**

- **Prevent accidents:** Secrets not hardcoded by default
- **Best practices:** Environment variables encouraged
- **Trust:** Users can confidently use in CI/CD

**Practices:**

- ✅ Secrets stored in env vars: `"token": "${API_TOKEN}"`
- ✅ HTTPS required for remote: `https://...` only
- ✅ No persistent secrets: Stateless
- ✅ Environment substitution: For secrets

**Example:**

```json
{
  "auth": {
    "token": "${API_SECRET}" // ✅ Never hardcode
  }
}
```

```bash
export API_SECRET="secret123"
mcp list
```

**Trade-off:** Slight setup overhead vs. strong default security.

---

## Design Patterns

### Layered Architecture

```
┌─────────────────────────────────┐
│      CLI Commands               │ (list, call)
├─────────────────────────────────┤
│      Command Handlers           │ (discovery, execution)
├─────────────────────────────────┤
│      Gateway Layer              │ (coordinator, registry)
├─────────────────────────────────┤
│      Config, Auth, Transport    │ (composition layer)
├─────────────────────────────────┤
│      Core Utilities             │ (errors, output, retry)
└─────────────────────────────────┘
```

**Benefits:**

- Clear separation of concerns
- Easy to test each layer
- Easy to modify one layer without affecting others
- Clear data flow

### Factory Pattern for Auth

```
AuthFactory.create(config.auth)
  ├─→ config.auth.type === "bearer"  →  BearerProvider
  ├─→ config.auth.type === "oauth"   →  OAuthProvider
  └─→ default                         →  NoAuthProvider
```

**Why?**

- Add new auth types without modifying existing code
- Auth selection logic in one place
- Extensible for future auth methods

### Registry Pattern for Tools

```
ToolRegistry:
  - Stores tools per server
  - Resolves "server.tool" to actual tool
  - Detects ambiguous names
  - Aggregates all tools
```

**Why?**

- Namespacing and conflict detection
- Single point for tool resolution
- Easy to query: "find all tools from server X"

### Coordinator Pattern

```
Coordinator:
  - Manages MCP client lifecycle
  - Handles connection/disconnection
  - Manages authentication
  - Handles retries and timeouts
```

**Why?**

- Clean separation of MCP protocol from business logic
- Easy to test (mock coordinator)
- Retry logic centralized

---

## Error Handling Philosophy

### Principle: Fail Clearly, Help Recover

```
Validation (early)
    ↓ Invalid config? Config error
Config loading
    ↓ Bad JSON? Config error
Server connection
    ↓ Can't connect? Connection error
Tool resolution
    ↓ Not found? Tool not found error
Tool execution
    ↓ Tool throws? Execution error
```

**Each error includes:**

- **Type:** Machine-readable error category
- **Message:** Human-readable explanation
- **Details:** Context for debugging (safe, no secrets)

**Example:**

```json
{
  "success": false,
  "error": {
    "type": "invalid_input",
    "message": "Invalid input for tool: add_numbers",
    "details": {
      "expected": { "type": "number" },
      "received": "string"
    }
  }
}
```

---

## Output Philosophy

### Clean Default, Verbose Optional

**By default (stdout):**

- JSON only
- No decorations
- Machine-parseable
- For scripting

**With --verbose (stderr):**

- Debug timestamps
- Operation trace
- Server connection details
- For debugging

**Why split?**

- Agents can parse stdout reliably
- Developers can see what's happening with --verbose
- No mixing concerns
- Easy to redirect separately

---

## Naming Philosophy

### Tools: Server.ToolName Format

```
database.query           # Clear where it comes from
auth.validate_token     # Namespace prevents conflicts
file_service.read_file  # Underscore for compound names
```

**Why?**

- Source is explicit
- Prevents collisions
- Self-documenting

### Commands: Verb + Noun

```
mcp list    # Discover tools
mcp call    # Execute tool
```

**Why?**

- Follows CLI conventions
- Clear intent

### Config: Descriptive Keys

```json
{
  "servers": [], // Collection of servers
  "profiles": {}, // Groupings
  "auth": { "type": "..." } // Type-based dispatch
}
```

**Why?**

- Self-documenting
- Clear structure

---

## Performance Philosophy

### Optimize for Latency, Not Throughput

Since each invocation is independent:

**Priority 1:** Minimize startup time

- Fresh process each time
- Quick config load
- Fast discovery

**Priority 2:** Minimize command execution time

- Parallel queries
- Early timeouts
- No unnecessary work

**Priority 3:** Minimize memory usage

- Stateless (no accumulation)
- Stream results (don't buffer huge responses)

**Not optimized for:**

- Batch operations (that's not the design)
- Throughput (sequential commands, not server)
- Long-running connections (stateless)

---

## Testing Philosophy

### Levels of Testing

1. **Unit tests** - Individual functions
2. **Integration tests** - Mock MCP servers
3. **E2E tests** - Real server processes
4. **Manual tests** - With real agents

**Why layered?**

- Quick feedback (unit tests)
- Realistic (integration tests)
- Confidence (E2E tests)
- Real-world validation (manual)

---

## Evolution Philosophy

### Design for Extension

**Current (v0.1):**

- `list` command
- `call` command
- Basic auth (bearer, oauth)

**Future (intentional space for):**

- `add` / `remove` commands
- Config management commands
- Authentication types (API key, etc.)
- Caching layer
- Advanced profiling

**Design ensures:**

- Can add commands without refactoring
- Can add auth types without touching coordinator
- Can add features without breaking existing behavior

---

## Summary: Design Tradeoffs

| Choice               | Benefit                    | Cost               |
| -------------------- | -------------------------- | ------------------ |
| Stateless            | Reliable, safe, simple     | Slight overhead    |
| Config file          | Single source of truth     | Must maintain file |
| Parallel discovery   | Fast                       | Slightly complex   |
| Explicit namespacing | Clear, safe                | More verbose       |
| JSON everywhere      | Agent-friendly, composable | Must validate well |
| Security by default  | Safe                       | Setup overhead     |

**Overall:** Prioritizes **reliability, clarity, and safety** over convenience and brevity.

---

## Next Steps

- 🏗️ **[Architecture](architecture.md)** — System design
- 🔐 **[Authentication Flows](auth-flows.md)** — How auth works
- 🏷️ **[Tool Namespacing](tool-namespacing.md)** — Namespace design
