/**
 * Tool Disambiguation System (Pattern 2)
 * 
 * Handles tool naming collisions across multiple servers and provides
 * intelligent suggestions for disambiguation. When multiple servers have
 * the same tool name, this system helps users and the system resolve which
 * server's tool to use.
 * 
 * @module gateway/tool-disambiguation
 */

import { ToolDefinition } from '@modelcontextprotocol/sdk/types.js';
import { ServerRegistry } from './server-registry.js';

/**
 * Information about ambiguous tool matches
 */
export interface AmbiguousToolInfo {
  /** The tool name being searched for */
  toolName: string;
  
  /** All matches found across servers */
  matches: Array<{
    /** Which server has this tool */
    server: string;
    /** The tool definition */
    tool: ToolDefinition;
    /** Confidence score 0-1 (for fuzzy matching) */
    confidence: number;
  }>;
  
  /** Suggested disambiguation approach */
  suggestion?: {
    /** Recommended server to use */
    recommendedServer: string;
    /** Reason for recommendation */
    reason: 'only_source' | 'most_reliable' | 'best_match';
    /** How to qualify the tool name */
    qualifiedName: string;
  };
}

/**
 * Information about tool search results with disambiguation
 */
export interface ResolvedToolInfo {
  /** Tool found successfully */
  found: boolean;
  
  /** The resolved tool definition */
  tool?: ToolDefinition;
  
  /** Which server provides this tool */
  server?: string;
  
  /** Full qualified tool name (server:tool) */
  qualifiedName?: string;
  
  /** Ambiguity info if multiple servers have this tool */
  ambiguity?: AmbiguousToolInfo;
  
  /** User-friendly message */
  message: string;
}

/**
 * Detect tool name collisions across all servers in the registry
 * 
 * @param registry - ServerRegistry containing all servers and their tools
 * @param searchTerm - The tool name to search for
 * @returns Ambiguity information if collisions detected, null otherwise
 * 
 * @example
 * ```typescript
 * const ambig = detectAmbiguousTools(registry, 'my_tool');
 * if (ambig) {
 *   console.log(`Found in ${ambig.matches.length} servers`);
 * }
 * ```
 */
export function detectAmbiguousTools(
  registry: ServerRegistry,
  searchTerm: string
): AmbiguousToolInfo | null {
  const matches: AmbiguousToolInfo['matches'] = [];

  // Search all tracked servers in registry
  const serverNames = registry.listNames();
  
  for (const serverName of serverNames) {
    const status = registry.getServerStatus(serverName);
    if (!status || !status.toolDefinitions) continue;

    // Look for exact matches
    for (const tool of status.toolDefinitions) {
      if (tool.name === searchTerm) {
        matches.push({
          server: serverName,
          tool,
          confidence: 1.0, // Exact match
        });
      }
    }
  }

  // No matches found
  if (matches.length === 0) {
    return null;
  }

  // Not ambiguous if only one server has it
  if (matches.length === 1) {
    return null;
  }

  // Ambiguous: multiple servers have the same tool
  // Determine recommendation based on server reliability
  const reliabilityScored = matches.map(m => ({
    ...m,
    reliabilityScore: getServerReliabilityScore(registry, m.server),
  }));

  // Sort by reliability
  reliabilityScored.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  const recommended = reliabilityScored[0];
  const isOnlySource = matches.length === 1;
  const isBestMatch = !isOnlySource;

  return {
    toolName: searchTerm,
    matches: matches,
    suggestion: {
      recommendedServer: recommended.server,
      reason: isOnlySource ? 'only_source' : 'most_reliable',
      qualifiedName: suggestToolQualification(searchTerm, recommended.server),
    },
  };
}

/**
 * Suggest a qualified tool name to disambiguate
 * 
 * Format: "server-name:tool_name"
 * 
 * @param toolName - The tool name
 * @param serverName - The server name
 * @returns Qualified tool name
 * 
 * @example
 * ```typescript
 * const qualified = suggestToolQualification('my_tool', 'server-a');
 * // Returns: "server-a:my_tool"
 * ```
 */
export function suggestToolQualification(
  toolName: string,
  serverName: string
): string {
  return `${serverName}:${toolName}`;
}

/**
 * Resolve a tool name to a specific server, handling disambiguation
 * 
 * Supports both:
 * - Unqualified: "my_tool" (uses recommendation)
 * - Qualified: "server-a:my_tool" (explicit)
 * 
 * @param registry - ServerRegistry with all servers
 * @param toolReference - Tool name (qualified or unqualified)
 * @returns Resolved tool information
 * 
 * @example
 * ```typescript
 * // Unqualified (uses best match)
 * const result1 = resolveToolName(registry, 'my_tool');
 * 
 * // Qualified (explicit server)
 * const result2 = resolveToolName(registry, 'server-a:my_tool');
 * ```
 */
export function resolveToolName(
  registry: ServerRegistry,
  toolReference: string
): ResolvedToolInfo {
  // Check if it's a qualified name (contains ':')
  if (toolReference.includes(':')) {
    const [serverName, toolName] = toolReference.split(':', 2);
    return resolveQualifiedTool(registry, serverName, toolName);
  }

  // Unqualified: search for the tool
  return resolveUnqualifiedTool(registry, toolReference);
}

/**
 * Resolve a qualified tool name (server:tool)
 */
function resolveQualifiedTool(
  registry: ServerRegistry,
  serverName: string,
  toolName: string
): ResolvedToolInfo {
  const status = registry.getServerStatus(serverName);

  if (!status) {
    return {
      found: false,
      message: `Server not found: ${serverName}`,
    };
  }

  if (!status.toolDefinitions) {
    return {
      found: false,
      message: `Server ${serverName} has no tools loaded`,
    };
  }

  const tool = status.toolDefinitions.find(t => t.name === toolName);

  if (!tool) {
    return {
      found: false,
      message: `Tool ${toolName} not found on server ${serverName}`,
    };
  }

  return {
    found: true,
    tool,
    server: serverName,
    qualifiedName: suggestToolQualification(toolName, serverName),
    message: `Tool resolved: ${serverName}:${toolName}`,
  };
}

/**
 * Resolve an unqualified tool name (just tool_name)
 * Uses disambiguation to pick the best server
 */
function resolveUnqualifiedTool(
  registry: ServerRegistry,
  toolName: string
): ResolvedToolInfo {
  const ambig = detectAmbiguousTools(registry, toolName);

  // No ambiguity and tool exists on some server
  if (ambig === null) {
    // Still need to find which server has it
    const serverNames = registry.listNames();
    for (const serverName of serverNames) {
      const status = registry.getServerStatus(serverName);
      if (!status || !status.toolDefinitions) continue;

      const tool = status.toolDefinitions.find(t => t.name === toolName);
      if (tool) {
        return {
          found: true,
          tool,
          server: serverName,
          qualifiedName: suggestToolQualification(toolName, serverName),
          message: `Tool resolved: ${serverName}:${toolName} (only source)`,
        };
      }
    }

    return {
      found: false,
      message: `Tool not found: ${toolName}`,
    };
  }

  // Ambiguous: multiple servers have it
  const recommended = ambig.suggestion!;
  const recommendedMatch = ambig.matches.find(
    m => m.server === recommended.recommendedServer
  );

  if (!recommendedMatch) {
    return {
      found: false,
      message: `Tool ambiguous: ${toolName} found in multiple servers`,
      ambiguity: ambig,
    };
  }

  return {
    found: true,
    tool: recommendedMatch.tool,
    server: recommended.recommendedServer,
    qualifiedName: recommended.qualifiedName,
    ambiguity: ambig,
    message: `Tool resolved: ${recommended.qualifiedName} (recommended from ${ambig.matches.length} options)`,
  };
}

/**
 * Get reliability score for a server (0-1)
 * Based on connection success rate and response times
 * 
 * Servers that are connected and responsive are more reliable
 */
function getServerReliabilityScore(
  registry: ServerRegistry,
  serverName: string
): number {
  const status = registry.getServerStatus(serverName);
  if (!status) return 0;

  let score = 0.5; // Base score

  // Bonus for being connected
  if (status.connected) {
    score += 0.3;
  } else {
    score -= 0.3;
  }

  // Bonus for lower average response time (faster = more reliable)
  if (status.averageResponseTime !== undefined) {
    // Fast: < 100ms = +0.2
    // Medium: 100-500ms = +0.1
    // Slow: > 500ms = -0.1
    if (status.averageResponseTime < 100) {
      score += 0.2;
    } else if (status.averageResponseTime < 500) {
      score += 0.1;
    } else {
      score -= 0.1;
    }
  }

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Find close matches using simple Levenshtein distance
 * Useful for suggesting alternatives when exact match not found
 * 
 * @param registry - ServerRegistry with all servers
 * @param searchTerm - The tool name to search for
 * @param maxDistance - Maximum distance to consider a match (default: 2)
 * @returns Array of close matches, sorted by distance
 */
export function findCloseToolMatches(
  registry: ServerRegistry,
  searchTerm: string,
  maxDistance: number = 2
): Array<{ tool: ToolDefinition; server: string; distance: number }> {
  const matches: Array<{ tool: ToolDefinition; server: string; distance: number }> = [];

  const serverNames = registry.listNames();
  for (const serverName of serverNames) {
    const status = registry.getServerStatus(serverName);
    if (!status || !status.toolDefinitions) continue;

    for (const tool of status.toolDefinitions) {
      const distance = levenshteinDistance(searchTerm, tool.name);
      if (distance <= maxDistance) {
        matches.push({ tool, server: serverName, distance });
      }
    }
  }

  // Sort by distance (lower is better)
  matches.sort((a, b) => a.distance - b.distance);
  return matches;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of tool names
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
