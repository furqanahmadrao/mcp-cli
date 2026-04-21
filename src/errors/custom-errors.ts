/**
 * Custom error classes for mcpcli
 */

export enum ErrorType {
    CONNECTION_ERROR = "connection_error",
    TOOL_NOT_FOUND = "tool_not_found",
    INVALID_INPUT = "invalid_input",
    EXECUTION_ERROR = "execution_error",
    CONFIG_ERROR = "config_error",
    AMBIGUOUS_TOOL = "ambiguous_tool",
    UNKNOWN = "unknown",
}

export class McpcliError extends Error {
    constructor(
        public type: ErrorType,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "McpcliError";
    }
}

export class ConfigError extends McpcliError {
    constructor(message: string, details?: unknown) {
        super(ErrorType.CONFIG_ERROR, message, details);
        this.name = "ConfigError";
    }
}

export class ConnectionError extends McpcliError {
    constructor(message: string, details?: unknown) {
        super(ErrorType.CONNECTION_ERROR, message, details);
        this.name = "ConnectionError";
    }
}

export class ToolNotFoundError extends McpcliError {
    constructor(toolName: string, details?: unknown) {
        super(
            ErrorType.TOOL_NOT_FOUND,
            `Tool "${toolName}" not found`,
            details
        );
        this.name = "ToolNotFoundError";
    }
}

export class InvalidInputError extends McpcliError {
    constructor(message: string, details?: unknown) {
        super(ErrorType.INVALID_INPUT, message, details);
        this.name = "InvalidInputError";
    }
}

export class ExecutionError extends McpcliError {
    constructor(message: string, details?: unknown) {
        super(ErrorType.EXECUTION_ERROR, message, details);
        this.name = "ExecutionError";
    }
}

export class AmbiguousToolError extends McpcliError {
    constructor(toolName: string, servers: string[]) {
        super(
            ErrorType.AMBIGUOUS_TOOL,
            `Tool "${toolName}" found in multiple servers: ${servers.join(", ")}. Use "server.tool_name" to disambiguate.`,
            { servers }
        );
        this.name = "AmbiguousToolError";
    }
}
