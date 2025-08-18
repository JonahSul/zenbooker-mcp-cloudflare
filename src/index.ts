import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Interface for environment variables
interface Env {
	ZENBOOKER_API_KEY: string;
}

// Zenbooker API base URL
const ZENBOOKER_API_BASE = "https://api.zenbooker.com/v1";

// Helper function to make authenticated API requests
async function makeZenbookerRequest(
	endpoint: string,
	method: string = "GET",
	body?: any,
	apiKey?: string
) {
	if (!apiKey) {
		throw new Error("Zenbooker API key is required");
	}

	const url = `${ZENBOOKER_API_BASE}${endpoint}`;
	const headers: HeadersInit = {
		"Authorization": `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	};

	const config: RequestInit = {
		method,
		headers,
	};

	if (body && method !== "GET") {
		config.body = JSON.stringify(body);
	}

	const response = await fetch(url, config);
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Zenbooker API Error (${response.status}): ${errorText}`);
	}

	return response.json();
}

// Global API key storage
let globalApiKey: string | undefined;

// Define our Zenbooker MCP agent
export class ZenbookerMCP extends McpAgent {
	server = new McpServer({
		name: "Zenbooker API",
		version: "1.0.0",
	});

	static setApiKey(key?: string) {
		globalApiKey = key;
	}

	static getApiKey(): string | undefined {
		return globalApiKey;
	}

	async init() {
		// ========== JOBS ENDPOINTS ==========
		
		// List all jobs
		this.server.tool(
			"list_jobs",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of jobs to return (1-100, defaults to API default)"),
				customer_id: z.string().optional().describe("Filter jobs by specific customer ID"),
				status: z.string().optional().describe("Filter jobs by status (e.g., 'pending', 'completed', 'cancelled')"),
				start_date: z.string().optional().describe("Filter jobs scheduled on or after this date (ISO 8601 format: YYYY-MM-DD)"),
				end_date: z.string().optional().describe("Filter jobs scheduled on or before this date (ISO 8601 format: YYYY-MM-DD)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, ZenbookerMCP.getApiKey());
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Get a specific job
		this.server.tool(
			"get_job",
			{
				id: z.string().describe("The unique job ID to retrieve detailed information for"),
			},
			async ({ id }) => {
				const result = await makeZenbookerRequest(`/jobs/${id}`, "GET", undefined, ZenbookerMCP.getApiKey());
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== CUSTOMERS ENDPOINTS ==========
		
		// List all customers
		this.server.tool(
			"list_customers",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of customers to return (1-100, defaults to API default)"),
				search: z.string().optional().describe("Search customers by name, email, or phone number"),
				email: z.string().optional().describe("Filter customers by exact email address"),
				phone: z.string().optional().describe("Filter customers by phone number"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Get a specific customer
		this.server.tool(
			"get_customer",
			{
				id: z.string().describe("The unique customer ID to retrieve detailed information for"),
			},
			async ({ id }) => {
				const result = await makeZenbookerRequest(`/customers/${id}`, "GET", undefined, globalApiKey);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Create a new customer
		this.server.tool(
			"create_customer",
			{
				first_name: z.string().describe("Customer's first name (required)"),
				last_name: z.string().describe("Customer's last name (required)"),
				email: z.string().email().optional().describe("Customer's email address (must be valid email format)"),
				phone: z.string().optional().describe("Customer's phone number"),
				address: z.string().optional().describe("Customer's street address"),
				city: z.string().optional().describe("Customer's city"),
				state: z.string().optional().describe("Customer's state or province"),
				zip: z.string().optional().describe("Customer's ZIP or postal code"),
				notes: z.string().optional().describe("Additional notes or comments about the customer"),
			},
			async (params) => {
				const result = await makeZenbookerRequest("/customers", "POST", params, globalApiKey);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Update a customer
		this.server.tool(
			"update_customer",
			{
				id: z.string().describe("The unique customer ID to update"),
				first_name: z.string().optional().describe("Updated first name for the customer"),
				last_name: z.string().optional().describe("Updated last name for the customer"),
				email: z.string().email().optional().describe("Updated email address (must be valid email format)"),
				phone: z.string().optional().describe("Updated phone number"),
				address: z.string().optional().describe("Updated street address"),
				city: z.string().optional().describe("Updated city"),
				state: z.string().optional().describe("Updated state or province"),
				zip: z.string().optional().describe("Updated ZIP or postal code"),
				notes: z.string().optional().describe("Updated notes or comments about the customer"),
			},
			async ({ id, ...params }) => {
				const result = await makeZenbookerRequest(`/customers/${id}`, "PATCH", params, globalApiKey);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== INVOICES ENDPOINTS ==========
		
		// List all invoices
		this.server.tool(
			"list_invoices",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of invoices to return (1-100, defaults to API default)"),
				customer_id: z.string().optional().describe("Filter invoices by specific customer ID"),
				status: z.string().optional().describe("Filter invoices by status (e.g., 'draft', 'sent', 'paid', 'overdue')"),
				start_date: z.string().optional().describe("Filter invoices created on or after this date (ISO 8601 format: YYYY-MM-DD)"),
				end_date: z.string().optional().describe("Filter invoices created on or before this date (ISO 8601 format: YYYY-MM-DD)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Get a specific invoice
		this.server.tool(
			"get_invoice",
			{
				id: z.string().describe("The unique invoice ID to retrieve detailed information for"),
			},
			async ({ id }) => {
				const result = await makeZenbookerRequest(`/invoices/${id}`, "GET", undefined, globalApiKey);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== TRANSACTIONS ENDPOINTS ==========
		
		// List all transactions
		this.server.tool(
			"list_transactions",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of transactions to return (1-100, defaults to API default)"),
				customer_id: z.string().optional().describe("Filter transactions by specific customer ID"),
				invoice_id: z.string().optional().describe("Filter transactions by specific invoice ID"),
				start_date: z.string().optional().describe("Filter transactions created on or after this date (ISO 8601 format: YYYY-MM-DD)"),
				end_date: z.string().optional().describe("Filter transactions created on or before this date (ISO 8601 format: YYYY-MM-DD)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== TEAM MEMBERS ENDPOINTS ==========
		
		// List all team members
		this.server.tool(
			"list_team_members",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of team members to return (1-100, defaults to API default)"),
				active: z.boolean().optional().describe("Filter team members by active status (true for active, false for inactive)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/team_members${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== RECURRING BOOKINGS ENDPOINTS ==========
		
		// List all recurring bookings (max 40 per request)
		this.server.tool(
			"list_recurring_bookings",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(40).optional().describe("Maximum number of recurring bookings to return (1-40, lower limit due to data complexity)"),
				customer_id: z.string().optional().describe("Filter recurring bookings by specific customer ID"),
				active: z.boolean().optional().describe("Filter recurring bookings by active status (true for active, false for inactive)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/recurring${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== TERRITORIES ENDPOINTS ==========
		
		// List all service territories
		this.server.tool(
			"list_territories",
			{
				cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
				limit: z.number().min(1).max(100).optional().describe("Maximum number of territories to return (1-100, defaults to API default)"),
			},
			async (params) => {
				const queryParams = new URLSearchParams();
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined) {
						queryParams.append(key, String(value));
					}
				});
				
				const endpoint = `/territories${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
				const result = await makeZenbookerRequest(endpoint, "GET", undefined, globalApiKey);
				
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// ========== COUPONS ENDPOINTS ==========
		
		// Create a coupon
		this.server.tool(
			"create_coupon",
			{
				code: z.string().describe("Unique coupon code that customers will use (e.g., 'SAVE20', 'WELCOME10')"),
				name: z.string().describe("Display name for the coupon (e.g., '20% Off Spring Cleaning')"),
				description: z.string().optional().describe("Optional detailed description of the coupon and its terms"),
				discount_type: z.enum(["percentage", "fixed_amount"]).describe("Type of discount: 'percentage' for % off or 'fixed_amount' for dollar amount off"),
				discount_value: z.number().describe("Discount value: percentage (0-100) if percentage type, or dollar amount if fixed_amount type"),
				valid_from: z.string().optional().describe("Date when coupon becomes valid (ISO 8601 format: YYYY-MM-DD)"),
				valid_until: z.string().optional().describe("Date when coupon expires (ISO 8601 format: YYYY-MM-DD)"),
				max_uses: z.number().optional().describe("Maximum number of times this coupon can be used across all customers"),
				min_order_value: z.number().optional().describe("Minimum order value required to use this coupon (in dollars)"),
			},
			async (params) => {
				const result = await makeZenbookerRequest("/coupons", "POST", params, globalApiKey);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Set the API key from environment variables
		ZenbookerMCP.setApiKey(env.ZENBOOKER_API_KEY);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return ZenbookerMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return ZenbookerMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
