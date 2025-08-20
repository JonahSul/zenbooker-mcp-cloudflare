/**
 * Team member management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List team members tool implementation
 */
export const listTeamMembersTool: ToolImplementation = {
	name: "list_team_members",
	description: "Retrieve a paginated list of team members (service providers and staff) with optional filtering by active status. Returns team member profiles including contact information, roles, and availability.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of team members to return (1-100, defaults to API default)"),
		active: z.boolean().optional().describe("Filter team members by active status (true for active, false for inactive)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/team_members${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All team member tools exported as an array
 */
export const teamMemberTools = [
	listTeamMembersTool,
] as const;