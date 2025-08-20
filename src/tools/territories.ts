/**
 * Territory management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List territories tool implementation
 */
export const listTerritoriesTools: ToolImplementation = {
	name: "list_territories",
	description: "Retrieve a paginated list of service territories and coverage areas. Returns geographic regions where services are provided, including ZIP codes, cities, and service boundaries.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of territories to return (1-100, defaults to API default)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/territories${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All territory tools exported as an array
 */
export const territoryTools = [
	listTerritoriesTools,
] as const;