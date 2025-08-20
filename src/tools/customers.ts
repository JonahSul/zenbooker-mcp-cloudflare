/**
 * Customer management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";

/**
 * List customers tool implementation
 */
export const listCustomersTool: ToolImplementation = {
	name: "list_customers",
	description: "Retrieve a paginated list of customers with optional search and filtering capabilities. Search by name, email, or phone number to find specific customers.",
	schema: {
		cursor: z.number().optional().describe("Pagination cursor for retrieving the next set of results"),
		limit: z.number().min(1).max(100).optional().describe("Maximum number of customers to return (1-100, defaults to API default)"),
		search: z.string().optional().describe("Search customers by name, email, or phone number"),
		email: z.string().optional().describe("Filter customers by exact email address"),
		phone: z.string().optional().describe("Filter customers by phone number"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Get specific customer tool implementation
 */
export const getCustomerTool: ToolImplementation = {
	name: "get_customer",
	description: "Retrieve detailed information for a specific customer by their unique ID. Returns complete customer profile including contact information, address, and account details.",
	schema: {
		id: z.string().describe("The unique customer ID to retrieve detailed information for"),
	},
	handler: async (params, apiKey) => {
		const result = await makeZenbookerRequest(`/customers/${params.id}`, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Create customer tool implementation
 */
export const createCustomerTool: ToolImplementation = {
	name: "create_customer",
	description: "Create a new customer record in the Zenbooker system. Requires first and last name, with optional contact information including email, phone, address, and notes.",
	schema: {
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
	handler: async (params, apiKey) => {
		const result = await makeZenbookerRequest("/customers", "POST", params, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Update customer tool implementation
 */
export const updateCustomerTool: ToolImplementation = {
	name: "update_customer",
	description: "Update an existing customer's information. Provide the customer ID and any fields you want to modify. All fields except ID are optional and only provided fields will be updated.",
	schema: {
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
	handler: async (params, apiKey) => {
		const { id, ...updateData } = params;
		const result = await makeZenbookerRequest(`/customers/${id}`, "PATCH", updateData, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All customer tools exported as an array
 */
export const customerTools = [
	listCustomersTool,
	getCustomerTool,
	createCustomerTool,
	updateCustomerTool,
] as const;