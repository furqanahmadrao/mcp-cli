# Installation Guide

Install `mcpcli` with your preferred package manager.

## System Requirements

- **Node.js:** 18.0.0 or later
- **npm:** 8.0.0 or later (included with Node.js)
- **Disk space:** ~50 MB
- **OS:** Windows, macOS, or Linux

## Installation Methods

### Global Installation (Recommended)

Install `mcpcli` globally so you can use it from anywhere:

```bash
npm install -g mcpcli
```

**Verify installation:**

```bash
mcp --version
mcp --help
```

### Local Project Installation

Install as a dev dependency in your project:

```bash
cd my-project
npm install --save-dev mcpcli
```

**Use with npx:**

```bash
npx mcp list
npx mcp call my_tool '{"param": "value"}'
```

### Using npx (No Installation)

Run directly without installing:

```bash
npx mcpcli list
npx mcpcli call my_tool '{"param": "value"}'
```

!!! note "npx version"
npx comes with npm 5.2+. Ensure you have it:
`bash
    npm --version  # Should be 5.2 or later
    `

## Verify Installation

After installation, verify everything works:

```bash
# Check version
$ mcp --version
mcpcli v0.1.0

# Check help documentation
$ mcp --help
Usage: mcp [options] [command]

Options:
  --version       Show version number
  --help          Show help
  --verbose       Enable verbose logging

Commands:
  list            Discover tools from all servers
  call <tool>     Execute a tool with JSON input
```

## Platform-Specific Guides

=== "Windows"

    **Using Command Prompt or PowerShell:**
    ```bash
    npm install -g mcpcli
    mcp --version
    ```

    **Configuration Location:**
    ```
    C:\Users\YourUsername\.mcp\mcp.json
    ```

    **Paths in Config:**
    ```json
    {
      "servers": [{
        "command": "C:\\path\\to\\server.js"
      }]
    }
    ```

=== "macOS"

    **Using Terminal:**
    ```bash
    npm install -g mcpcli
    mcp --version
    ```

    **Configuration Location:**
    ```
    ~/.mcp/mcp.json
    ```

    **Paths in Config:**
    ```json
    {
      "servers": [{
        "command": "/path/to/server.js"
      }]
    }
    ```

=== "Linux"

    **Using Terminal:**
    ```bash
    npm install -g mcpcli
    mcp --version
    ```

    **Configuration Location:**
    ```
    ~/.mcp/mcp.json
    ```

    **Paths in Config:**
    ```json
    {
      "servers": [{
        "command": "/path/to/server.js"
      }]
    }
    ```

## Update mcpcli

Keep `mcpcli` up to date:

```bash
# Check for updates
npm outdated -g

# Update globally
npm update -g mcpcli

# Or reinstall latest version
npm install -g mcpcli@latest
```

## Uninstall

Remove `mcpcli`:

```bash
npm uninstall -g mcpcli
```

## Troubleshooting Installation

### "Command not found: mcp"

The global npm bin directory is not in your PATH.

**macOS/Linux:**

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH=$(npm config get prefix)/bin:$PATH

# Reload shell
source ~/.bashrc
# or
source ~/.zshrc
```

**Windows:**

1. Find npm bin directory: `npm config get prefix`
2. Add to PATH environment variable
3. Restart terminal

### "Permission denied"

Try installing with sudo (not recommended):

```bash
sudo npm install -g mcpcli --unsafe-perm
```

Or fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### "npm: not found"

Node.js/npm not installed. [Download Node.js](https://nodejs.org/) (includes npm).

### "EACCES" Error (Permission Issue)

**Linux/macOS:**

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g mcpcli

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to shell profile
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Getting Started After Installation

Once installed:

1. **[Create your first config](../guides/configuration.md)** — Set up your MCP servers
2. **[List available tools](../getting-started/quick-start.md)** — Discover what you can do
3. **[Execute your first tool](../tutorials/first-execution.md)** — Run a real tool

## Support

- **Installation issues:** [GitHub Issues](https://github.com/yourusername/mcp-cli/issues)
- **NPM package page:** [mcpcli on npm](https://www.npmjs.com/package/mcpcli)
- **Version history:** [Changelog](../reference/changelog.md)
