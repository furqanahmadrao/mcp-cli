/**
 * Error Recovery Hints
 * 
 * Pattern 7: Error Context & Recovery Hints
 * Provides helpful suggestions and recovery steps for common errors
 */

import type { CustomError } from './custom-errors.js';
import {
    ConnectionError,
    ToolNotFoundError,
    InvalidInputError,
    ExecutionError,
    ConfigError,
    AmbiguousToolError,
    UnknownError,
} from './custom-errors.js';

/**
 * Recovery hint for an error
 */
export interface RecoveryHint {
    diagnosis: string;
    suggestions: string[];
    documentation?: string;
}

/**
 * Get recovery hints for common errors
 */
export function getRecoveryHint(error: Error): RecoveryHint {
    if (error instanceof ConnectionError) {
        return getConnectionErrorHint(error);
    }

    if (error instanceof ToolNotFoundError) {
        return getToolNotFoundHint(error);
    }

    if (error instanceof InvalidInputError) {
        return getInvalidInputHint(error);
    }

    if (error instanceof ExecutionError) {
        return getExecutionErrorHint(error);
    }

    if (error instanceof ConfigError) {
        return getConfigErrorHint(error);
    }

    if (error instanceof AmbiguousToolError) {
        return getAmbiguousToolHint(error);
    }

    return getGenericErrorHint(error);
}

/**
 * Hint for connection errors
 */
function getConnectionErrorHint(error: ConnectionError): RecoveryHint {
    const hints: Record<string, RecoveryHint> = {
        'ECONNREFUSED': {
            diagnosis:
                'Cannot connect to server. The server may not be running or listening on the specified port/socket.',
            suggestions: [
                'Check if the server is running',
                'Verify the server address and port are correct',
                'Check if firewall is blocking the connection',
                'Try connecting manually to test the connection',
                'Run: mcp health <server> to diagnose',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/connection-refused',
        },
        'ENOTFOUND': {
            diagnosis: 'DNS resolution failed. Cannot reach server by hostname.',
            suggestions: [
                'Verify the hostname is spelled correctly',
                'Check your network connectivity',
                'Try using IP address instead of hostname',
                'Check DNS settings',
                'Run: mcp health <server> for more info',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/dns-error',
        },
        'ETIMEDOUT': {
            diagnosis:
                'Connection timed out. The server is not responding within the timeout period.',
            suggestions: [
                'Check if the server is overloaded',
                'Increase timeout: mcp call <tool> --timeout=10000',
                'Check network latency',
                'Verify server is running: mcp health <server>',
                'Check server logs for errors',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/timeout',
        },
        'default': {
            diagnosis: 'Failed to connect to server. The server may be unreachable or experiencing issues.',
            suggestions: [
                'Run: mcp health <server> to diagnose connection',
                'Check server logs for errors',
                'Verify server configuration in ~/.mcp/mcp.json',
                'Try restarting the server',
                'Test with verbose output: mcp list --verbose',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/connection-failed',
        },
    };

    // Try to extract the error code
    const errorCode = (error.cause as any)?.code || (error as any).code || 'default';
    return hints[errorCode] || hints['default'];
}

/**
 * Hint for tool not found errors
 */
function getToolNotFoundHint(error: ToolNotFoundError): RecoveryHint {
    const suggestions = [
        'Run: mcp list to see all available tools',
        'Check the tool name spelling',
        'Is the tool in the right namespace? (e.g., database.search_users)',
    ];

    // Try to provide specific suggestions if available
    if ((error as any).suggestions && (error as any).suggestions.length > 0) {
        suggestions.unshift(`Did you mean one of these? ${(error as any).suggestions.join(', ')}`);
    }

    return {
        diagnosis: `Tool not found: ${(error as any).toolName || 'unknown'}. The tool does not exist in any configured server.`,
        suggestions,
        documentation: 'https://docs.mcp-cli.io/errors/tool-not-found',
    };
}

/**
 * Hint for invalid input errors
 */
function getInvalidInputHint(error: InvalidInputError): RecoveryHint {
    return {
        diagnosis: `Invalid input provided: ${error.message}. The input does not match the tool's expected parameters.`,
        suggestions: [
            'Check the tool parameters: mcp list | grep <tool>',
            'Verify all required parameters are provided',
            'Check parameter types match the schema',
            'Review the tool description for examples',
            'Use --verbose for more details',
        ],
        documentation: 'https://docs.mcp-cli.io/errors/invalid-input',
    };
}

/**
 * Hint for execution errors
 */
function getExecutionErrorHint(error: ExecutionError): RecoveryHint {
    const errorMsg = error.message.toLowerCase();

    // Analyze the error message for common patterns
    if (errorMsg.includes('timeout')) {
        return {
            diagnosis: 'Tool execution timed out. The tool did not complete within the timeout period.',
            suggestions: [
                'The server may be slow or overloaded',
                'The operation may be computationally expensive',
                'Try increasing timeout: mcp call <tool> --timeout=10000',
                'Check server health: mcp health <server>',
                'Check server logs for slow queries',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/execution-timeout',
        };
    }

    if (errorMsg.includes('memory') || errorMsg.includes('out of')) {
        return {
            diagnosis: 'Server ran out of memory. The tool operation exceeded available memory.',
            suggestions: [
                'The server may be handling too large a dataset',
                'Try with smaller input or parameters',
                'Restart the server to free memory',
                'Check server resource limits',
                'Consider splitting the operation into smaller parts',
            ],
            documentation: 'https://docs.mcp-cli.io/errors/memory-exceeded',
        };
    }

    return {
        diagnosis: `Tool execution failed: ${error.message}. The tool ran but encountered an error.`,
        suggestions: [
            'Check the tool parameters and inputs',
            'Review the server logs for error details',
            'Try with simpler inputs first',
            'Check server health: mcp health <server>',
            'Run with verbose output: mcp call <tool> --verbose',
        ],
        documentation: 'https://docs.mcp-cli.io/errors/execution-error',
    };
}

/**
 * Hint for configuration errors
 */
function getConfigErrorHint(error: ConfigError): RecoveryHint {
    const suggestions = [
        'Check your config file: ~/.mcp/mcp.json or ~/.mcp/mcp.yaml',
        'Validate your config: mcp config validate',
        'Review the example config: https://docs.mcp-cli.io/guide/configuration',
    ];

    if (error.message.includes('required')) {
        suggestions.unshift('Missing required field in configuration');
    }

    if (error.message.includes('invalid')) {
        suggestions.unshift('Invalid value in configuration');
    }

    return {
        diagnosis: `Configuration error: ${error.message}`,
        suggestions,
        documentation: 'https://docs.mcp-cli.io/errors/config-error',
    };
}

/**
 * Hint for ambiguous tool errors
 */
function getAmbiguousToolHint(error: AmbiguousToolError): RecoveryHint {
    let diagnosis = `Tool name is ambiguous: ${(error as any).toolName}. Multiple servers have a tool with this name.`;

    const suggestions = ['Use fully qualified name: <server>.<tool_name>'];

    if ((error as any).matches && (error as any).matches.length > 0) {
        const matchList = (error as any).matches.map((m: string) => `  • ${m}`).join('\n');
        suggestions.unshift(`Matching tools:\n${matchList}`);
    }

    return {
        diagnosis,
        suggestions,
        documentation: 'https://docs.mcp-cli.io/errors/ambiguous-tool',
    };
}

/**
 * Hint for generic/unknown errors
 */
function getGenericErrorHint(error: Error): RecoveryHint {
    return {
        diagnosis: `An unexpected error occurred: ${error.message}`,
        suggestions: [
            'Run with verbose output for more details: --verbose',
            'Check the error message and search for solutions',
            'Review recent changes to your configuration',
            'Try with a simple test tool first',
            'Check https://docs.mcp-cli.io for troubleshooting guides',
        ],
        documentation: 'https://docs.mcp-cli.io/errors/unknown',
    };
}

/**
 * Format recovery hint as a string
 */
export function formatRecoveryHint(hint: RecoveryHint): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('Diagnosis:');
    lines.push(`  ${hint.diagnosis}`);

    lines.push('');
    lines.push('Recovery steps:');
    for (let i = 0; i < hint.suggestions.length; i++) {
        lines.push(`  ${i + 1}. ${hint.suggestions[i]}`);
    }

    if (hint.documentation) {
        lines.push('');
        lines.push('Learn more:');
        lines.push(`  ${hint.documentation}`);
    }

    return lines.join('\n');
}
