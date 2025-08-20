/**
 * Jobs management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List jobs tool implementation
 */
export const listJobsTool: ToolImplementation = {
	name: "list_jobs",
	description: "Retrieve a paginated list of jobs with optional filtering by customer, status, and date range. Returns job details including status, customer information, and scheduling data.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of jobs to return (1-100, defaults to API default)"),
		customer_id: z.string().optional().describe("Filter jobs by specific customer ID"),
		status: z.string().optional().describe("Filter jobs by status (e.g., 'pending', 'completed', 'cancelled')"),
		start_date: z.string().optional().describe("Filter jobs scheduled on or after this date (ISO 8601 format: YYYY-MM-DD)"),
		end_date: z.string().optional().describe("Filter jobs scheduled on or before this date (ISO 8601 format: YYYY-MM-DD)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Get specific job tool implementation
 */
export const getJobTool: ToolImplementation = {
	name: "get_job",
	description: "Retrieve detailed information for a specific job by its unique ID. Returns comprehensive job data including customer details, scheduling, status, and service information.",
	schema: {
		id: z.string().describe("The unique job ID to retrieve detailed information for"),
	},
	handler: async (params, apiKey) => {
		const result = await makeZenbookerRequest(`/jobs/${params.id}`, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All jobs tools exported as an array
 */
export const jobsTools = [
	listJobsTool,
	getJobTool,
] as const;