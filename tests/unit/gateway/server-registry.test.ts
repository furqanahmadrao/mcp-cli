/**
 * Tests for ServerRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ServerRegistry, createRegistryFromConfigs } from '../gateway/server-registry.js';
import type { ServerConfig } from '../config/types.js';

describe('ServerRegistry', () => {
    let registry: ServerRegistry;
    const mockConfig: ServerConfig = {
        name: 'test-server',
        type: 'stdio',
        command: 'test-command',
    };

    beforeEach(() => {
        registry = new ServerRegistry();
    });

    describe('Registration', () => {
        it('should register a server', () => {
            registry.register('test', mockConfig);
            expect(registry.has('test')).toBe(true);
        });

        it('should return registered server', () => {
            registry.register('test', mockConfig);
            const server = registry.get('test');
            expect(server).toBeDefined();
            expect(server?.name).toBe('test');
            expect(server?.config).toEqual(mockConfig);
        });

        it('should list all server names', () => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
            const names = registry.listNames();
            expect(names).toEqual(['server1', 'server2']);
        });

        it('should return server count', () => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
            expect(registry.count()).toBe(2);
        });

        it('should get all servers', () => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
            const all = registry.getAll();
            expect(all).toHaveLength(2);
            expect(all[0].name).toBe('server1');
            expect(all[1].name).toBe('server2');
        });
    });

    describe('Connection Status', () => {
        beforeEach(() => {
            registry.register('test', mockConfig);
        });

        it('should mark server as connected', () => {
            registry.markConnected('test', 5);
            const server = registry.get('test');
            expect(server?.connected).toBe(true);
            expect(server?.toolCount).toBe(5);
            expect(server?.lastError).toBeUndefined();
        });

        it('should mark server as disconnected', () => {
            const error = new Error('Connection failed');
            registry.markDisconnected('test', error);
            const server = registry.get('test');
            expect(server?.connected).toBe(false);
            expect(server?.lastError?.message).toBe('Connection failed');
        });

        it('should update metadata on connection', () => {
            registry.markConnected('test', 3);
            let server = registry.get('test');
            expect(server?.metadata.connectionAttempts).toBe(1);
            expect(server?.metadata.successfulDiscoveries).toBe(1);
            expect(server?.metadata.failedDiscoveries).toBe(0);

            // Try again
            registry.markConnected('test', 3);
            server = registry.get('test');
            expect(server?.metadata.connectionAttempts).toBe(2);
            expect(server?.metadata.successfulDiscoveries).toBe(2);
        });

        it('should update metadata on disconnection', () => {
            registry.markConnected('test', 3);
            registry.markDisconnected('test', new Error('Failed'));
            const server = registry.get('test');
            expect(server?.metadata.failedDiscoveries).toBe(1);
        });

        it('should record connection attempts', () => {
            registry.recordConnectionAttempt('test');
            registry.recordConnectionAttempt('test');
            let server = registry.get('test');
            expect(server?.metadata.connectionAttempts).toBe(2);
        });
    });

    describe('Response Time Tracking', () => {
        beforeEach(() => {
            registry.register('test', mockConfig);
            registry.markConnected('test', 0);
        });

        it('should record response times', () => {
            registry.recordResponseTime('test', 100);
            registry.recordResponseTime('test', 200);
            const avg = registry.getAverageResponseTime('test');
            expect(avg).toBe(150);
        });

        it('should return 0 average for no successful discoveries', () => {
            registry.clear();
            registry.register('test', mockConfig);
            const avg = registry.getAverageResponseTime('test');
            expect(avg).toBe(0);
        });

        it('should handle single response time', () => {
            registry.recordResponseTime('test', 500);
            const avg = registry.getAverageResponseTime('test');
            expect(avg).toBe(500);
        });
    });

    describe('Status Reporting', () => {
        beforeEach(() => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
        });

        it('should get status summary for all servers', () => {
            registry.markConnected('server1', 5);
            registry.markDisconnected('server2', new Error('Failed'));
            const status = registry.getStatus();
            expect(status).toHaveLength(2);
            expect(status[0].connected).toBe(true);
            expect(status[1].connected).toBe(false);
        });

        it('should get status for specific server', () => {
            registry.markConnected('server1', 5);
            const status = registry.getServerStatus('server1');
            expect(status).toBeDefined();
            expect(status?.connected).toBe(true);
            expect(status?.toolCount).toBe(5);
        });

        it('should return undefined for non-existent server', () => {
            const status = registry.getServerStatus('non-existent');
            expect(status).toBeUndefined();
        });

        it('should calculate health summary', () => {
            registry.markConnected('server1', 5);
            registry.markConnected('server2', 3);
            const health = registry.getHealthSummary();
            expect(health.totalServers).toBe(2);
            expect(health.connectedServers).toBe(2);
            expect(health.failedServers).toBe(0);
            expect(health.totalTools).toBe(8);
        });

        it('should track partial failures', () => {
            registry.markConnected('server1', 5);
            registry.markDisconnected('server2', new Error('Timeout'));
            const health = registry.getHealthSummary();
            expect(health.connectedServers).toBe(1);
            expect(health.failedServers).toBe(1);
            expect(health.totalTools).toBe(5);
        });
    });

    describe('Utility Functions', () => {
        it('should reset metrics', () => {
            registry.register('test', mockConfig);
            registry.markConnected('test', 3);
            registry.recordResponseTime('test', 100);
            registry.resetMetrics();
            const server = registry.get('test');
            expect(server?.metadata.connectionAttempts).toBe(0);
            expect(server?.metadata.successfulDiscoveries).toBe(0);
            expect(server?.metadata.totalResponseTime).toBe(0);
        });

        it('should clear all servers', () => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
            registry.clear();
            expect(registry.count()).toBe(0);
        });

        it('should get comprehensive summary', () => {
            registry.register('server1', mockConfig);
            registry.register('server2', mockConfig);
            registry.markConnected('server1', 5);
            registry.recordResponseTime('server1', 100);
            
            const summary = registry.getSummary();
            expect(summary.totalServers).toBe(2);
            expect(summary.connectedServers).toBe(1);
            expect(summary.metrics.server1).toBeDefined();
            expect(summary.metrics.server2).toBeDefined();
        });
    });

    describe('Factory Function', () => {
        it('should create registry from configs', () => {
            const configs: ServerConfig[] = [
                { name: 'server1', type: 'stdio', command: 'cmd1' },
                { name: 'server2', type: 'stdio', command: 'cmd2' },
            ];
            const reg = createRegistryFromConfigs(configs);
            expect(reg.count()).toBe(2);
            expect(reg.has('server1')).toBe(true);
            expect(reg.has('server2')).toBe(true);
        });

        it('should handle empty configs', () => {
            const reg = createRegistryFromConfigs([]);
            expect(reg.count()).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should throw error when marking non-existent server connected', () => {
            expect(() => registry.markConnected('non-existent', 0)).toThrow();
        });

        it('should throw error when marking non-existent server disconnected', () => {
            expect(() => registry.markDisconnected('non-existent', new Error('Test'))).toThrow();
        });
    });

    describe('Multiple Operations', () => {
        it('should handle complex scenario', () => {
            // Register servers
            registry.register('db', mockConfig);
            registry.register('cache', mockConfig);
            registry.register('fs', mockConfig);

            // Simulate operations
            registry.markConnected('db', 10);
            registry.recordResponseTime('db', 50);
            registry.recordResponseTime('db', 75);

            registry.markConnected('cache', 5);
            registry.recordResponseTime('cache', 10);

            registry.markDisconnected('fs', new Error('Timeout'));

            // Check results
            const health = registry.getHealthSummary();
            expect(health.totalServers).toBe(3);
            expect(health.connectedServers).toBe(2);
            expect(health.failedServers).toBe(1);
            expect(health.totalTools).toBe(15);

            // Check individual metrics
            expect(registry.getAverageResponseTime('db')).toBe(62.5);
            expect(registry.getAverageResponseTime('cache')).toBe(10);
            expect(registry.getAverageResponseTime('fs')).toBe(0);
        });
    });
});
