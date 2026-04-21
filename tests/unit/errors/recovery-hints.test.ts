/**
 * Tests for Recovery Hints
 */

import { describe, it, expect } from 'vitest';
import {
    getRecoveryHint,
    formatRecoveryHint,
    type RecoveryHint,
} from '../errors/recovery-hints.js';
import {
    ConnectionError,
    ToolNotFoundError,
    InvalidInputError,
    ExecutionError,
    ConfigError,
    AmbiguousToolError,
} from '../errors/custom-errors.js';

describe('Recovery Hints', () => {
    describe('Connection Errors', () => {
        it('should provide hint for connection refused', () => {
            const error = new ConnectionError('Connection refused', {
                cause: { code: 'ECONNREFUSED' },
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('cannot connect');
            expect(hint.suggestions.length).toBeGreaterThan(0);
            expect(hint.documentation).toBeDefined();
        });

        it('should provide hint for DNS not found', () => {
            const error = new ConnectionError('DNS not found', {
                cause: { code: 'ENOTFOUND' },
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('DNS');
            expect(hint.suggestions.length).toBeGreaterThan(0);
        });

        it('should provide hint for timeout', () => {
            const error = new ConnectionError('Connection timeout', {
                cause: { code: 'ETIMEDOUT' },
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('timeout');
            expect(hint.suggestions.some((s) => s.includes('timeout'))).toBe(true);
        });

        it('should provide generic hint for unknown connection error', () => {
            const error = new ConnectionError('Unknown error', {
                cause: { code: 'UNKNOWN' },
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('Failed to connect');
            expect(hint.suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('Tool Not Found Errors', () => {
        it('should provide hint for tool not found', () => {
            const error = new ToolNotFoundError('tool_name not found', {
                toolName: 'search_users',
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('Tool not found');
            expect(hint.suggestions.length).toBeGreaterThan(0);
            expect(hint.documentation).toBeDefined();
        });

        it('should include suggestions from error context', () => {
            const error = new ToolNotFoundError('tool not found', {
                toolName: 'search',
                suggestions: ['db.search_users', 'fs.search_files'],
            });
            const hint = getRecoveryHint(error);
            expect(hint.suggestions[0]).toContain('search_users');
        });
    });

    describe('Invalid Input Errors', () => {
        it('should provide hint for invalid input', () => {
            const error = new InvalidInputError('Invalid parameter type');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('Invalid input');
            expect(hint.suggestions.length).toBeGreaterThan(0);
            expect(hint.suggestions.some((s) => s.includes('mcp list'))).toBe(true);
        });
    });

    describe('Execution Errors', () => {
        it('should provide hint for timeout execution', () => {
            const error = new ExecutionError('Tool execution timeout after 30s');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('timeout');
            expect(hint.suggestions.some((s) => s.includes('timeout'))).toBe(true);
        });

        it('should provide hint for memory error', () => {
            const error = new ExecutionError('Out of memory');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('memory');
            expect(hint.suggestions.some((s) => s.includes('memory'))).toBe(true);
        });

        it('should provide generic hint for other execution errors', () => {
            const error = new ExecutionError('Tool failed with status 1');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('execution failed');
            expect(hint.suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('Config Errors', () => {
        it('should provide hint for config error', () => {
            const error = new ConfigError('Invalid configuration');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('Configuration error');
            expect(hint.suggestions.length).toBeGreaterThan(0);
            expect(hint.documentation).toBeDefined();
        });

        it('should provide hint for missing required field', () => {
            const error = new ConfigError('Missing required parameter: token');
            const hint = getRecoveryHint(error);
            expect(hint.suggestions.some((s) => s.includes('required'))).toBe(true);
        });
    });

    describe('Ambiguous Tool Errors', () => {
        it('should provide hint for ambiguous tool', () => {
            const error = new AmbiguousToolError('Tool is ambiguous', {
                toolName: 'search',
                matches: ['db.search', 'fs.search'],
            });
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('ambiguous');
            expect(hint.suggestions.some((s) => s.includes('fully qualified'))).toBe(true);
        });

        it('should list matching tools', () => {
            const error = new AmbiguousToolError('Tool is ambiguous', {
                toolName: 'get_user',
                matches: ['database.get_user', 'cache.get_user'],
            });
            const hint = getRecoveryHint(error);
            expect(hint.suggestions.some((s) => s.includes('database.get_user'))).toBe(true);
        });
    });

    describe('Generic Errors', () => {
        it('should provide hint for unknown error', () => {
            const error = new Error('Some unexpected error');
            const hint = getRecoveryHint(error);
            expect(hint.diagnosis).toContain('unexpected');
            expect(hint.suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('Formatting', () => {
        it('should format hint as readable string', () => {
            const hint: RecoveryHint = {
                diagnosis: 'Test diagnosis',
                suggestions: ['Step 1', 'Step 2'],
                documentation: 'https://docs.example.com',
            };
            const formatted = formatRecoveryHint(hint);
            expect(formatted).toContain('Diagnosis:');
            expect(formatted).toContain('Recovery steps:');
            expect(formatted).toContain('Step 1');
            expect(formatted).toContain('Step 2');
            expect(formatted).toContain('Learn more:');
            expect(formatted).toContain('docs.example.com');
        });

        it('should format hint without documentation', () => {
            const hint: RecoveryHint = {
                diagnosis: 'Test diagnosis',
                suggestions: ['Step 1'],
            };
            const formatted = formatRecoveryHint(hint);
            expect(formatted).toContain('Diagnosis:');
            expect(formatted).not.toContain('Learn more:');
        });

        it('should number suggestions', () => {
            const hint: RecoveryHint = {
                diagnosis: 'Test',
                suggestions: ['First', 'Second', 'Third'],
            };
            const formatted = formatRecoveryHint(hint);
            expect(formatted).toContain('1. First');
            expect(formatted).toContain('2. Second');
            expect(formatted).toContain('3. Third');
        });
    });
});
