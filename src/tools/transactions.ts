/**
 * Transaction management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List transactions tool implementation
 */
export const listTransactionsTool: ToolImplementation = {
	name: "list_transactions",
	description: "Retrieve a paginated list of payment transactions with optional filtering by customer, invoice, and date range. Returns transaction details including amounts, payment methods, and status.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of transactions to return (1-100, defaults to API default)"),
		customer_id: z.string().optional().describe("Filter transactions by specific customer ID"),
		invoice_id: z.string().optional().describe("Filter transactions by specific invoice ID"),
		start_date: z.string().optional().describe("Filter transactions created on or after this date (ISO 8601 format: YYYY-MM-DD)"),
		end_date: z.string().optional().describe("Filter transactions created on or before this date (ISO 8601 format: YYYY-MM-DD)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All transaction tools exported as an array
 */
export const transactionTools = [
	listTransactionsTool,
] as const;