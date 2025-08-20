/**
 * Scheduling management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * Check territory coverage tool implementation
 */
export const checkTerritoryCoverageTool: ToolImplementation = {
	name: "check_territory_coverage",
	description: "Check if a given address is within one of the serviced territories. Returns territory information, service coverage status, and estimated travel times.",
	schema: {
		address: z.string().describe("The full address to check for territory coverage (street, city, state, zip)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/territories/check-coverage?${queryParams.toString()}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Get available appointments tool implementation
 */
export const getAvailableAppointmentsTool: ToolImplementation = {
	name: "get_available_appointments",
	description: "Determine the next available appointment times for a given address based on territory coverage and team member availability. Returns up to 10 appointment slots with team member details.",
	schema: {
		address: z.string().describe("The full address where service is requested (street, city, state, zip)"),
		service_duration: z.number().min(15).max(480).describe("Expected service duration in minutes (15-480 minutes)"),
		limit: z.number().min(1).max(10).optional().describe("Maximum number of appointment slots to return (1-10, defaults to 10)"),
		start_date: z.string().optional().describe("Earliest date to search for appointments (ISO 8601 format: YYYY-MM-DD, defaults to today)"),
	},
	handler: async (params, apiKey) => {
		// Set default limit if not provided
		const paramsWithDefaults = {
			...params,
			limit: params.limit || 10
		};
		
		const queryParams = buildQueryParams(paramsWithDefaults);
		const endpoint = `/scheduling/available-appointments?${queryParams.toString()}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Check adjacent territories tool implementation
 */
export const checkAdjacentTerritoresTool: ToolImplementation = {
	name: "check_adjacent_territories",
	description: "For addresses outside all serviced territories, find nearby territories that could potentially be expanded to cover the address. Useful for business expansion planning.",
	schema: {
		address: z.string().describe("The full address to check for adjacent territories (street, city, state, zip)"),
		max_distance: z.number().min(1).max(50).optional().describe("Maximum distance in miles to search for adjacent territories (1-50 miles, defaults to 10)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/territories/check-adjacent?${queryParams.toString()}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All scheduling tools exported as an array
 */
export const schedulingTools = [
	checkTerritoryCoverageTool,
	getAvailableAppointmentsTool,
	checkAdjacentTerritoresTool,
] as const;