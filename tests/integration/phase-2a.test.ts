/**
 * Integration tests for Phase 2A
 * 
 * Tests the integration of ServerRegistry with:
 * - GatewayCoordinator
 * - Discovery handler
 * - Execution handler
 * - Error formatter with recovery hints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServerRegistry } from '../../gateway/server-registry.js';
import { GatewayCoordinator } from '../../gateway/coordinator.js';
import { formatError } from '../../errors/error-formatter.js';
import {
    ConnectionError,
    ToolNotFoundError,
    ExecutionError,
} from '../../errors/custom-errors.js';
import type { ServerConfig } from '../../config/types.js';

describe('Phase 2A Integration Tests', () => {
    let registry: ServerRegistry;
    let coordinator: GatewayCoordinator;
    let testServer: ServerConfig;

    beforeEach(() => {
        registry = new ServerRegistry();
        coordinator = new GatewayCoordinator(5000, registry);
        testServer = {
            name: 'test-server',
            type: 'stdio',
            command: 'echo "test"',
        };
    });

    afterEach(() => {
        registry.clear();
    });

    describe('ServerRegistry + GatewayCoordinator Integration', () => {
        it('should initialize registry from coordinator', () => {
            const servers = [testServer];
            coordinator.initializeRegistry(servers);

            expect(registry.count()).toBe(1);
            expect(registry.has('test-server')).toBe(true);
        });

        it('should track server connection lifecycle', () => {
            coordinator.initializeRegistry([testServer]);

            // Initial state
            let status = registry.getServerStatus('test-server');
            expect(status?.connected).toBe(false);

            // Mark connected
            registry.markConnected('test-server', 5);
            status = registry.getServerStatus('test-server');
            expect(status?.connected).toBe(true);
            expect(status?.toolCount).toBe(5);

            // Mark disconnected
            const error = new Error('Closed');
            registry.markDisconnected('test-server', error);
            status = registry.getServerStatus('test-server');
            expect(status?.connected).toBe(false);
        });

        it('should access registry from coordinator', () => {
            coordinator.initializeRegistry([testServer]);
            const coordinatorRegistry = coordinator.getRegistry();

            expect(coordinatorRegistry.has('test-server')).toBe(true);
            expect(coordinatorRegistry.count()).toBe(1);
        });

        it('should report health summary', () => {
            coordinator.initializeRegistry([
                testServer,
                { name: 'server2', type: 'stdio', command: 'cmd2' },
            ]);

            registry.markConnected('test-server', 3);
            const error = new Error('Failed');
            registry.markDisconnected('server2', error);

            const summary = coordinator.getHealthSummary();
            expect(summary.totalServers).toBe(2);
            expect(summary.connectedServers).toBe(1);
            expect(summary.failedServers).toBe(1);
            expect(summary.totalTools).toBe(3);
        });

        it('should track response times across servers', () => {
            coordinator.initializeRegistry([testServer]);

            registry.markConnected('test-server', 0);
            registry.recordResponseTime('test-server', 100);
            registry.recordResponseTime('test-server', 200);

            const avgTime = registry.getAverageResponseTime('test-server');
            expect(avgTime).toBe(150);
        });
    });

    describe('Error Formatter + Recovery Hints Integration', () => {
        it('should format connection error with recovery hints', () => {
            const error = new ConnectionError('Connection failed', {
                serverName: 'test-server',
                cause: { code: 'ECONNREFUSED' },
            });

            const response = formatError(error);

            expect(response.success).toBe(false);
            expect(response.error.type).toBe('connection_error');
            expect(response.error.recovery).toBeDefined();
            expect(response.error.recovery?.diagnosis).toContain('cannot connect');
            expect(response.error.recovery?.steps.length).toBeGreaterThan(0);
        });

        it('should format tool not found error with suggestions', () => {
            const error = new ToolNotFoundError('Tool not found', {
                toolName: 'search_users',
            });

            const response = formatError(error);

            expect(response.success).toBe(false);
            expect(response.error.recovery).toBeDefined();
            expect(response.error.recovery?.diagnosis).toContain('Tool not found');
        });

        it('should format execution error with recovery guidance', () => {
            const error = new ExecutionError('Tool execution timeout after 30s');

            const response = formatError(error);

            expect(response.success).toBe(false);
            expect(response.error.recovery).toBeDefined();
            expect(response.error.recovery?.diagnosis).toContain('timeout');
            expect(response.error.recovery?.steps.some((s) => s.includes('timeout'))).toBe(true);
        });

        it('should include documentation links in recovery hints', () => {
            const error = new ConnectionError('DNS not found', {
                cause: { code: 'ENOTFOUND' },
            });

            const response = formatError(error);

            expect(response.error.recovery?.documentation).toBeDefined();
            expect(response.error.recovery?.documentation).toContain('https://');
        });

        it('should work without recovery hints if disabled', () => {
            const error = new ExecutionError('Test error');
            const response = formatError(error, false);

            expect(response.error.recovery).toBeUndefined();
        });
    });

    describe('Multi-Server Scenario', () => {
        it('should track metrics for multiple servers', () => {
            const servers: ServerConfig[] = [
                { name: 'db', type: 'stdio', command: 'cmd1' },
                { name: 'cache', type: 'stdio', command: 'cmd2' },
                { name: 'fs', type: 'stdio', command: 'cmd3' },
            ];

            coordinator.initializeRegistry(servers);

            // Simulate server activity
            registry.markConnected('db', 10);
            registry.recordResponseTime('db', 50);
            registry.recordResponseTime('db', 100);

            registry.markConnected('cache', 5);
            registry.recordResponseTime('cache', 20);

            const connectionError = new Error('Connection timeout');
            registry.markDisconnected('fs', connectionError);

            // Verify summary
            const summary = coordinator.getHealthSummary();
            expect(summary.totalServers).toBe(3);
            expect(summary.connectedServers).toBe(2);
            expect(summary.failedServers).toBe(1);
            expect(summary.totalTools).toBe(15);

            // Verify individual metrics
            expect(registry.getAverageResponseTime('db')).toBe(75);
            expect(registry.getAverageResponseTime('cache')).toBe(20);
            expect(registry.getAverageResponseTime('fs')).toBe(0);
        });

        it('should handle partial failures gracefully', () => {
            const servers: ServerConfig[] = [
                { name: 'primary', type: 'stdio', command: 'cmd1' },
                { name: 'secondary', type: 'stdio', command: 'cmd2' },
            ];

            coordinator.initializeRegistry(servers);

            // Primary succeeds
            registry.markConnected('primary', 8);

            // Secondary fails
            const primaryError = new ConnectionError('Secondary unreachable');
            registry.markDisconnected('secondary', primaryError);

            // Should report partial success
            const summary = coordinator.getHealthSummary();
            expect(summary.connectedServers).toBe(1);
            expect(summary.failedServers).toBe(1);
            expect(summary.totalTools).toBe(8);

            // Health status should show both servers
            const status = coordinator.getHealthStatus();
            expect(status).toHaveLength(2);
            expect(status[0].connected).toBe(true);
            expect(status[1].connected).toBe(false);
        });
    });

    describe('Coordinator + Registry Lifecycle', () => {
        it('should initialize, track, and finalize properly', () => {
            const servers: ServerConfig[] = [
                { name: 'api', type: 'stdio', command: 'cmd1' },
                { name: 'db', type: 'stdio', command: 'cmd2' },
            ];

            // Initialize
            coordinator.initializeRegistry(servers);
            expect(registry.count()).toBe(2);

            // Record activity
            registry.recordConnectionAttempt('api');
            registry.markConnected('api', 12);
            registry.recordResponseTime('api', 150);

            registry.recordConnectionAttempt('db');
            registry.markConnected('db', 8);
            registry.recordResponseTime('db', 250);

            // Verify summary
            const summary = coordinator.getHealthSummary();
            expect(summary.totalServers).toBe(2);
            expect(summary.connectedServers).toBe(2);
            expect(summary.totalTools).toBe(20);

            // Get individual status
            const apiStatus = registry.getServerStatus('api');
            expect(apiStatus?.toolCount).toBe(12);
            expect(apiStatus?.responseTime).toBe(150);

            const dbStatus = registry.getServerStatus('db');
            expect(dbStatus?.toolCount).toBe(8);
            expect(dbStatus?.responseTime).toBe(250);
        });

        it('should provide comprehensive debugging summary', () => {
            coordinator.initializeRegistry([testServer]);

            registry.recordConnectionAttempt('test-server');
            registry.markConnected('test-server', 5);
            registry.recordResponseTime('test-server', 100);
            registry.recordResponseTime('test-server', 200);

            const summary = registry.getSummary();

            expect(summary.totalServers).toBe(1);
            expect(summary.connectedServers).toBe(1);
            expect(summary.metrics['test-server']).toBeDefined();
            expect(summary.metrics['test-server'].attempts).toBe(1);
            expect(summary.metrics['test-server'].successes).toBe(1);
            expect(summary.metrics['test-server'].failures).toBe(0);
            expect(summary.metrics['test-server'].avgResponseTime).toBe(150);
        });
    });

    describe('Error Recovery Flow', () => {
        it('should provide actionable recovery for common failures', () => {
            const errors: Array<[Error, (recovery: any) => void]> = [
                [
                    new ConnectionError('Cannot connect', { cause: { code: 'ECONNREFUSED' } }),
                    (recovery) => {
                        expect(recovery.diagnosis).toContain('cannot connect');
                        expect(recovery.steps).toContain('Check if the server is running');
                    },
                ],
                [
                    new ToolNotFoundError('Not found', { toolName: 'search' }),
                    (recovery) => {
                        expect(recovery.diagnosis).toContain('Tool not found');
                    },
                ],
                [
                    new ExecutionError('Timeout'),
                    (recovery) => {
                        expect(recovery.diagnosis).toContain('timeout');
                    },
                ],
            ];

            for (const [error, verify] of errors) {
                const response = formatError(error);
                expect(response.error.recovery).toBeDefined();
                verify(response.error.recovery);
            }
        });
    });
});
