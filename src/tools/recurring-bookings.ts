/**
 * Recurring booking management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List recurring bookings tool implementation
 */
export const listRecurringBookingsTool: ToolImplementation = {
	name: "list_recurring_bookings",
	description: "Retrieve a paginated list of recurring service bookings with optional filtering by customer and active status. Returns scheduled recurring services including frequency, timing, and next service dates. Limited to 40 results per request due to data complexity.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(40).optional().describe("Maximum number of recurring bookings to return (1-40, lower limit due to data complexity)"),
		customer_id: z.string().optional().describe("Filter recurring bookings by specific customer ID"),
		active: z.boolean().optional().describe("Filter recurring bookings by active status (true for active, false for inactive)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/recurring${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All recurring booking tools exported as an array
 */
export const recurringBookingTools = [
	listRecurringBookingsTool,
] as const;