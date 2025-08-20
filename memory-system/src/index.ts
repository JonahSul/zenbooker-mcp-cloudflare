/**
 * Memory System MCP Server
 * 
 * Independent Cloudflare Worker providing tool-enforced memory system for AI behavior regulation
 * 
 * Uses McpAgent framework for proper MCP transport handling instead of custom implementation.
 */

import { MemorySystemMCP } from "./agent.js";

// Interface for environment variables
interface Env {
	MEMORY_API_KEY?: string;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Log environment setup
		console.log("Memory System MCP Server starting...");
		if (env.MEMORY_API_KEY) {
			console.log("Memory API key found in environment");
		}

		// Handle SSE endpoint for MCP communication
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MemorySystemMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// Handle standard MCP endpoint
		if (url.pathname === "/mcp") {
			return MemorySystemMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Handle legacy endpoint for backwards compatibility
		if (url.pathname === "/.well-known/oauth-protected-resource") {
			return MemorySystemMCP.serve("/.well-known/oauth-protected-resource").fetch(request, env, ctx);
		}

		// Root endpoint with server information
		if (url.pathname === '/') {
			return new Response(JSON.stringify({
				name: "Memory System MCP Server",
				version: "1.0.0",
				description: "Tool-enforced memory system for AI behavior regulation using McpAgent framework",
				protocol: "MCP 2024-11-05",
				capabilities: ["tools", "resources"],
				endpoints: {
					sse: "/sse",
					mcp: "/mcp",
					legacy: "/.well-known/oauth-protected-resource"
				}
			}, null, 2), {
				headers: { 
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		return new Response('Memory System MCP Server\n\nEndpoints:\n- /sse (Server-Sent Events)\n- /mcp (Standard MCP)\n- /.well-known/oauth-protected-resource (Legacy)', {
			headers: { 
				'Content-Type': 'text/plain',
				'Access-Control-Allow-Origin': '*'
			}
		});
	},
};
