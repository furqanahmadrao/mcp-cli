/**
 * Error formatting for JSON output
 * 
 * Integrates with recovery hints system (Pattern 7) for helpful error messages
 */

import { McpcliError, ErrorType } from "./custom-errors.js";
import { getRecoveryHint } from "./recovery-hints.js";

export interface ErrorResponse {
    success: false;
    error: {
        type: string;
        message: string;
        details?: unknown;
        recovery?: {
            diagnosis: string;
            steps: string[];
            documentation?: string;
        };
    };
}

export function formatError(error: unknown, includeRecoveryHint: boolean = true): ErrorResponse {
    if (error instanceof McpcliError) {
        const response: ErrorResponse = {
            success: false,
            error: {
                type: error.type,
                message: error.message,
                ...(error.details && { details: error.details }),
            },
        };

        // Include recovery hints for helpful output
        if (includeRecoveryHint) {
            try {
                const hint = getRecoveryHint(error);
                response.error.recovery = {
                    diagnosis: hint.diagnosis,
                    steps: hint.suggestions,
                    ...(hint.documentation && { documentation: hint.documentation }),
                };
            } catch (err) {
                // Silently ignore if recovery hint fails
            }
        }

        return response;
    }

    if (error instanceof Error) {
        const response: ErrorResponse = {
            success: false,
            error: {
                type: ErrorType.UNKNOWN,
                message: error.message,
            },
        };

        // Include recovery hints even for generic errors
        if (includeRecoveryHint) {
            try {
                const hint = getRecoveryHint(error);
                response.error.recovery = {
                    diagnosis: hint.diagnosis,
                    steps: hint.suggestions,
                    ...(hint.documentation && { documentation: hint.documentation }),
                };
            } catch (err) {
                // Silently ignore if recovery hint fails
            }
        }

        return response;
    }

    return {
        success: false,
        error: {
            type: ErrorType.UNKNOWN,
            message: String(error),
        },
    };
}
