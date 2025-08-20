/**
 * Invoice management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List invoices tool implementation
 */
export const listInvoicesTool: ToolImplementation = {
	name: "list_invoices",
	description: "Retrieve a paginated list of invoices with optional filtering by customer, status, and date range. Returns invoice details including amounts, due dates, and payment status.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of invoices to return (1-100, defaults to API default)"),
		customer_id: z.string().optional().describe("Filter invoices by specific customer ID"),
		status: z.string().optional().describe("Filter invoices by status (e.g., 'draft', 'sent', 'paid', 'overdue')"),
		start_date: z.string().optional().describe("Filter invoices created on or after this date (ISO 8601 format: YYYY-MM-DD)"),
		end_date: z.string().optional().describe("Filter invoices created on or before this date (ISO 8601 format: YYYY-MM-DD)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Get specific invoice tool implementation
 */
export const getInvoiceTool: ToolImplementation = {
	name: "get_invoice",
	description: "Retrieve detailed information for a specific invoice by its unique ID. Returns comprehensive invoice data including line items, payment history, and customer details.",
	schema: {
		id: z.string().describe("The unique invoice ID to retrieve detailed information for"),
	},
	handler: async (params, apiKey) => {
		const result = await makeZenbookerRequest(`/invoices/${params.id}`, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All invoice tools exported as an array
 */
export const invoiceTools = [
	listInvoicesTool,
	getInvoiceTool,
] as const;