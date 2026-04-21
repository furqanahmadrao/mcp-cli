/**
 * Error Context System
 * 
 * Provides rich contextual information about errors including the operation
 * being performed, which server/tool was involved, timing information, and
 * suggested recovery steps. This makes error messages more actionable.
 * 
 * @module errors/error-context
 */

/**
 * Rich context information to attach to errors
 */
export interface ErrorContext {
  /** The operation being performed */
  operation: 'discovery' | 'execution' | 'health_check' | 'validation';

  /** The server involved, if applicable */
  server?: string;

  /** The tool involved, if applicable */
  tool?: string;

  /** How long the operation took (milliseconds) */
  duration?: number;

  /** Number of attempts made */
  attempts?: number;

  /** When the last attempt was made */
  lastAttempt?: Date;

  /** Suggested recovery steps */
  suggestions?: string[];

  /** Documentation URL for this error type */
  documentationUrl?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Formatted error output with context
 */
export interface FormattedError {
  /** Error message */
  message: string;

  /** Error type/category */
  type: string;

  /** Context information */
  context?: ErrorContext;

  /** Recovery suggestions */
  recovery?: string[];

  /** Stack trace if available */
  stack?: string;
}

/**
 * Symbol to store error context on Error objects
 */
const ERROR_CONTEXT_SYMBOL = Symbol('errorContext');

/**
 * Attach context information to an error
 * 
 * This modifies the error object to include context information that can
 * be accessed later for better error reporting and diagnostics.
 * 
 * @param error - The error to attach context to
 * @param context - Context information
 * @returns The same error object (for chaining)
 * 
 * @example
 * ```typescript
 * try {
 *   await executeCommand();
 * } catch (error) {
 *   attachErrorContext(error, {
 *     operation: 'execution',
 *     server: 'my-server',
 *     tool: 'my_tool',
 *     duration: 5000,
 *     suggestions: ['Check server logs', 'Verify configuration']
 *   });
 *   throw error;
 * }
 * ```
 */
export function attachErrorContext(
  error: any,
  context: ErrorContext
): Error {
  // Store context on the error object
  if (error && typeof error === 'object') {
    error[ERROR_CONTEXT_SYMBOL] = context;
  }
  return error;
}

/**
 * Retrieve context information from an error
 * 
 * @param error - The error to get context from
 * @returns Context information, or undefined if not attached
 * 
 * @example
 * ```typescript
 * try {
 *   // operation
 * } catch (error) {
 *   const context = getErrorContext(error);
 *   if (context) {
 *     console.log(`Failed server: ${context.server}`);
 *   }
 * }
 * ```
 */
export function getErrorContext(error: any): ErrorContext | undefined {
  if (error && typeof error === 'object' && ERROR_CONTEXT_SYMBOL in error) {
    return error[ERROR_CONTEXT_SYMBOL] as ErrorContext;
  }
  return undefined;
}

/**
 * Has context been attached to this error?
 */
export function hasErrorContext(error: any): boolean {
  return error && typeof error === 'object' && ERROR_CONTEXT_SYMBOL in error;
}

/**
 * Format an error with its context for output
 * 
 * @param error - The error to format
 * @returns Formatted error with context
 * 
 * @example
 * ```typescript
 * const formatted = formatErrorWithContext(error);
 * console.log(JSON.stringify(formatted, null, 2));
 * ```
 */
export function formatErrorWithContext(error: any): FormattedError {
  const message = error instanceof Error ? error.message : String(error);
  const type = error?.constructor?.name || 'UnknownError';
  const context = getErrorContext(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const formatted: FormattedError = {
    message,
    type,
    context,
    stack,
  };

  // Include recovery suggestions if available
  if (context?.suggestions && context.suggestions.length > 0) {
    formatted.recovery = context.suggestions;
  }

  return formatted;
}

/**
 * Create a formatted error message including context
 * 
 * @param error - The error
 * @returns Human-readable error message with context
 */
export function createErrorMessage(error: any): string {
  const formatted = formatErrorWithContext(error);
  const lines: string[] = [];

  lines.push(`Error: ${formatted.message}`);

  if (formatted.context) {
    const ctx = formatted.context;

    if (ctx.operation) {
      lines.push(`  Operation: ${ctx.operation}`);
    }

    if (ctx.server) {
      lines.push(`  Server: ${ctx.server}`);
    }

    if (ctx.tool) {
      lines.push(`  Tool: ${ctx.tool}`);
    }

    if (ctx.duration !== undefined) {
      lines.push(`  Duration: ${ctx.duration}ms`);
    }

    if (ctx.attempts !== undefined) {
      lines.push(`  Attempts: ${ctx.attempts}`);
    }
  }

  if (formatted.recovery && formatted.recovery.length > 0) {
    lines.push('');
    lines.push('Recovery Steps:');
    formatted.recovery.forEach((step, i) => {
      lines.push(`  ${i + 1}. ${step}`);
    });
  }

  if (formatted.context?.documentationUrl) {
    lines.push('');
    lines.push(`Learn more: ${formatted.context.documentationUrl}`);
  }

  return lines.join('\n');
}

/**
 * Builder for creating errors with context
 * 
 * @example
 * ```typescript
 * const error = new ErrorWithContext('Connection failed')
 *   .withOperation('execution')
 *   .withServer('my-server')
 *   .withTool('my_tool')
 *   .withDuration(5000)
 *   .addSuggestion('Check server logs')
 *   .build();
 * ```
 */
export class ErrorWithContext extends Error {
  private context: ErrorContext = { operation: 'execution' };

  constructor(message: string) {
    super(message);
    this.name = 'ErrorWithContext';
  }

  withOperation(
    operation: 'discovery' | 'execution' | 'health_check' | 'validation'
  ): this {
    this.context.operation = operation;
    return this;
  }

  withServer(server: string): this {
    this.context.server = server;
    return this;
  }

  withTool(tool: string): this {
    this.context.tool = tool;
    return this;
  }

  withDuration(duration: number): this {
    this.context.duration = duration;
    return this;
  }

  withAttempts(attempts: number): this {
    this.context.attempts = attempts;
    return this;
  }

  addSuggestion(suggestion: string): this {
    if (!this.context.suggestions) {
      this.context.suggestions = [];
    }
    this.context.suggestions.push(suggestion);
    return this;
  }

  addSuggestions(...suggestions: string[]): this {
    if (!this.context.suggestions) {
      this.context.suggestions = [];
    }
    this.context.suggestions.push(...suggestions);
    return this;
  }

  withDocumentationUrl(url: string): this {
    this.context.documentationUrl = url;
    return this;
  }

  withMetadata(key: string, value: unknown): this {
    if (!this.context.metadata) {
      this.context.metadata = {};
    }
    this.context.metadata[key] = value;
    return this;
  }

  getContext(): ErrorContext {
    return this.context;
  }

  build(): Error {
    const error = new Error(this.message);
    attachErrorContext(error, this.context);
    return error;
  }
}

/**
 * Context aware error wrapping
 * 
 * @example
 * ```typescript
 * try {
 *   await operation();
 * } catch (error) {
 *   throw wrapErrorWithContext(error, {
 *     operation: 'execution',
 *     server: 'my-server',
 *     suggestions: ['Check server status', 'Restart server']
 *   });
 * }
 * ```
 */
export function wrapErrorWithContext(
  error: any,
  context: Partial<ErrorContext>
): Error {
  // If error already has context, merge
  const existingContext = getErrorContext(error);
  const mergedContext: ErrorContext = {
    operation: context.operation || existingContext?.operation || 'execution',
    ...existingContext,
    ...context,
  };

  return attachErrorContext(error, mergedContext);
}

/**
 * Safe error context extraction helper
 * Returns null if error is not an Error object
 */
export function safeGetErrorContext(error: unknown): ErrorContext | null {
  if (error instanceof Error || (error && typeof error === 'object')) {
    return getErrorContext(error as any) || null;
  }
  return null;
}

/**
 * Create a summary of all context across multiple errors
 */
export function summarizeErrors(errors: Error[]): {
  totalErrors: number;
  operations: Set<string>;
  servers: Set<string>;
  tools: Set<string>;
  allSuggestions: string[];
} {
  const operations = new Set<string>();
  const servers = new Set<string>();
  const tools = new Set<string>();
  const allSuggestions = new Set<string>();

  for (const error of errors) {
    const context = getErrorContext(error);
    if (!context) continue;

    if (context.operation) {
      operations.add(context.operation);
    }
    if (context.server) {
      servers.add(context.server);
    }
    if (context.tool) {
      tools.add(context.tool);
    }
    if (context.suggestions) {
      context.suggestions.forEach(s => allSuggestions.add(s));
    }
  }

  return {
    totalErrors: errors.length,
    operations,
    servers,
    tools,
    allSuggestions: Array.from(allSuggestions),
  };
}
