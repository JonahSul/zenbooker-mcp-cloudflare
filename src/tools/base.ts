/**
 * Base types and utilities for MCP tools
 */

import { z } from "zod";
import type { ApiResponse } from "../types.js";

/**
 * Common tool result structure for MCP responses
 */
/**
 * Standard interface for MCP tool results
 */
export interface ToolResult {
	[x: string]: unknown;
	content: Array<{
		[x: string]: unknown;
		type: "text";
		text: string;
		_meta?: { [x: string]: unknown } | undefined;
	}>;
	_meta?: { [x: string]: unknown } | undefined;
	structuredContent?: { [x: string]: unknown } | undefined;
	isError?: boolean | undefined;
}/**
 * Base interface for tool implementations
 */
export interface ToolImplementation {
	name: string;
	description: string;
	schema: z.ZodRawShape;
	handler: (params: any, apiKey?: string) => Promise<ToolResult>;
}

/**
 * Helper function to build query string from parameters object
 * 
 * @param params - Object containing query parameters
 * @returns URLSearchParams instance with non-undefined values
 */
export function buildQueryParams(params: Record<string, unknown>): URLSearchParams {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			queryParams.append(key, String(value));
		}
	});
	return queryParams;
}

/**
 * Helper function to make authenticated API requests to the Zenbooker API
 * 
 * @param endpoint - The API endpoint path (e.g., '/customers', '/jobs/123')
 * @param method - HTTP method (GET, POST, PATCH, etc.)
 * @param body - Request body data for POST/PATCH requests
 * @param apiKey - Zenbooker API key for authentication
 * @returns Promise resolving to the parsed JSON response
 * @throws Error if API key is missing or API request fails
 */
export async function makeZenbookerRequest(
	endpoint: string,
	method: string = "GET",
	body?: Record<string, unknown>,
	apiKey?: string
): Promise<ApiResponse> {
	// Zenbooker API base URL
	const ZENBOOKER_API_BASE = "https://api.zenbooker.com/v1";
	
	// Try to get API key from parameter, then global, then environment
	const effectiveApiKey = apiKey;
	
	if (!effectiveApiKey) {
		throw new Error("Zenbooker API key is required. Please set the ZENBOOKER_API_KEY environment variable.");
	}

	const url = `${ZENBOOKER_API_BASE}${endpoint}`;
	const headers: HeadersInit = {
		"Authorization": `Bearer ${effectiveApiKey}`,
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

/**
 * Formats API response data into standard MCP tool result format
 * 
 * @param data - The data to format (typically from API response)
 * @returns Formatted tool result with JSON string content
 */
export function formatToolResult(data: unknown): ToolResult {
	return {
		content: [{ 
			type: "text", 
			text: JSON.stringify(data, null, 2) 
		}],
	};
}