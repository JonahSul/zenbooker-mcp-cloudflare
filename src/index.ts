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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
				customer_id: z.string().optional(),
				status: z.string().optional(),
				start_date: z.string().optional(),
				end_date: z.string().optional(),
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
				id: z.string().describe("The job ID"),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
				search: z.string().optional(),
				email: z.string().optional(),
				phone: z.string().optional(),
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
				id: z.string().describe("The customer ID"),
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
				first_name: z.string(),
				last_name: z.string(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				city: z.string().optional(),
				state: z.string().optional(),
				zip: z.string().optional(),
				notes: z.string().optional(),
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
				id: z.string().describe("The customer ID"),
				first_name: z.string().optional(),
				last_name: z.string().optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				city: z.string().optional(),
				state: z.string().optional(),
				zip: z.string().optional(),
				notes: z.string().optional(),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
				customer_id: z.string().optional(),
				status: z.string().optional(),
				start_date: z.string().optional(),
				end_date: z.string().optional(),
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
				id: z.string().describe("The invoice ID"),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
				customer_id: z.string().optional(),
				invoice_id: z.string().optional(),
				start_date: z.string().optional(),
				end_date: z.string().optional(),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
				active: z.boolean().optional(),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(40).optional(),
				customer_id: z.string().optional(),
				active: z.boolean().optional(),
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
				cursor: z.number().optional(),
				limit: z.number().min(1).max(100).optional(),
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
				code: z.string(),
				name: z.string(),
				description: z.string().optional(),
				discount_type: z.enum(["percentage", "fixed_amount"]),
				discount_value: z.number(),
				valid_from: z.string().optional(),
				valid_until: z.string().optional(),
				max_uses: z.number().optional(),
				min_order_value: z.number().optional(),
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
