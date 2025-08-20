import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiResponse } from "./types.js";
import { registerAllTools } from "./tools/registry.js";

// Interface for environment variables
interface Env {
	ZENBOOKER_API_KEY?: string;
}

interface ZenbookerEnvironment {
	ZENBOOKER_API_KEY?: string;
}

/**
 * Global API key storage for the main Worker context
 * Note: This does not persist into Durable Object execution contexts
 */
let globalApiKey: string | undefined;

/**
 * Zenbooker MCP Server implementation with modular tools
 * 
 * Provides comprehensive access to the Zenbooker API through 13 different tools
 * covering jobs, customers, invoices, transactions, team members, recurring bookings,
 * territories, and coupons.
 * 
 * This class extends McpAgent and implements the MCP protocol for Cloudflare Workers.
 * Tools are now organized in modular libraries for better maintainability.
 */
export class ZenbookerMCP extends McpAgent {
	server = new McpServer({
		name: "Zenbooker API",
		version: "1.0.0",
	});

	/**
	 * Sets the global API key for Zenbooker API authentication
	 * @param key - The Zenbooker API key or undefined to clear
	 */
	static setApiKey(key?: string) {
		globalApiKey = key;
	}

	/**
	 * Gets the current global API key
	 * @returns The current API key or undefined if not set
	 */
	static getApiKey(): string | undefined {
		return globalApiKey;
	}

	/**
	 * Gets the environment API key from the Durable Object context
	 * 
	 * This method handles the complexity of accessing environment variables
	 * within a Durable Object, where global variables from the main Worker
	 * context are not available.
	 * 
	 * @returns The API key from environment or global context
	 */
	getEnvironmentApiKey(): string | undefined {
		// In Durable Object context, we need to get the env from the state
		// The McpAgent framework should provide access to this
		return (this as unknown as { env?: ZenbookerEnvironment }).env?.ZENBOOKER_API_KEY || globalApiKey;
	}

	/**
	 * Initializes all MCP tools for the Zenbooker API using modular tool libraries
	 * 
	 * This method registers 13 comprehensive tools organized by resource type:
	 * - Jobs: list_jobs, get_job
	 * - Customers: list_customers, get_customer, create_customer, update_customer
	 * - Invoices: list_invoices, get_invoice
	 * - Transactions: list_transactions
	 * - Team Members: list_team_members
	 * - Recurring Bookings: list_recurring_bookings
	 * - Territories: list_territories
	 * - Coupons: create_coupon
	 */
	async init() {
		// Register all tools using the modular registry
		registerAllTools(this.server, this);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Set the API key from environment variables if available
		if (env.ZENBOOKER_API_KEY) {
			ZenbookerMCP.setApiKey(env.ZENBOOKER_API_KEY);
			console.log("API key set from environment:", env.ZENBOOKER_API_KEY ? "YES" : "NO");
		} else {
			console.warn("ZENBOOKER_API_KEY environment variable not found");
		}

		// Log the current state
		console.log("Current global API key:", ZenbookerMCP.getApiKey() ? "SET" : "NOT SET");

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return ZenbookerMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return ZenbookerMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};