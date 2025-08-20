/**
 * Tool registration utilities for the MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools, type ToolImplementation } from "./index.js";

/**
 * Environment interface for accessing API key
 */
interface ZenbookerEnvironment {
	ZENBOOKER_API_KEY?: string;
}

/**
 * Interface for API key provider
 */
interface ApiKeyProvider {
	getEnvironmentApiKey(): string | undefined;
}

/**
 * Registers a single tool with the MCP server
 * 
 * @param server - The MCP server instance
 * @param tool - The tool implementation to register
 * @param apiKeyProvider - Provider for API key access
 */
export function registerTool(
	server: McpServer,
	tool: ToolImplementation,
	apiKeyProvider: ApiKeyProvider
): void {
	server.tool(
		tool.name,
		tool.description,
		tool.schema,
		async (params) => {
			const apiKey = apiKeyProvider.getEnvironmentApiKey();
			return await tool.handler(params, apiKey);
		}
	);
}

/**
 * Registers all Zenbooker tools with the MCP server
 * 
 * @param server - The MCP server instance
 * @param apiKeyProvider - Provider for API key access
 */
export function registerAllTools(
	server: McpServer,
	apiKeyProvider: ApiKeyProvider
): void {
	for (const tool of allTools) {
		registerTool(server, tool, apiKeyProvider);
	}
}

/**
 * Registers tools by category with the MCP server
 * 
 * @param server - The MCP server instance
 * @param categories - Array of category names to register
 * @param apiKeyProvider - Provider for API key access
 */
export function registerToolsByCategory(
	server: McpServer,
	categories: string[],
	apiKeyProvider: ApiKeyProvider
): void {
	// This would need to be implemented based on the toolsByCategory structure
	// For now, we'll register all tools
	registerAllTools(server, apiKeyProvider);
}