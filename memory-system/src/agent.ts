/**
 * Memory System MCP Agent
 * 
 * Implements MCP server using the McpAgent framework for proper transport handling.
 * Replaces custom SSE implementation with framework-based approach.
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MemorySystem } from "./memory-tool.js";
import { foundationMigrationV1, applyFoundationMigration } from "../migrations/foundation.js";
import { registerMemoryTools } from "./tools/registry.js";

/**
 * Memory System MCP Agent
 * 
 * Extends McpAgent to provide behavioral memory tools through proper MCP transport.
 * Uses framework SSE handling instead of custom implementation.
 */
export class MemorySystemMCP extends McpAgent {
	server = new McpServer({
		name: "memory-system-mcp",
		version: "1.0.0",
	});

	private memory = new MemorySystem();

	/**
	 * Gets the memory instance for tool execution context
	 * @returns The memory system instance
	 */
	getMemoryInstance(): MemorySystem {
		return this.memory;
	}

	/**
	 * Initialize all memory tools using the modular registry
	 */
	async init() {
		// Apply foundation migration to establish core behavioral rules
		applyFoundationMigration(this.memory, foundationMigrationV1);
		
		// Set up global memory instance getter for tools
		(globalThis as any).getMemoryInstance = () => this.memory;
		
		// Register all memory tools using the modular registry
		registerMemoryTools(this.server, this);
	}
}
