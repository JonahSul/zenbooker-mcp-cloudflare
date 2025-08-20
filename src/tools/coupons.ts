/**
 * Coupon management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, type ToolImplementation } from "./base.js";

/**
 * Create coupon tool implementation
 */
export const createCouponTool: ToolImplementation = {
	name: "create_coupon",
	description: "Create a new promotional discount coupon for customers. Supports both percentage-based and fixed-amount discounts with optional validity dates, usage limits, and minimum order requirements.",
	schema: {
		code: z.string().describe("Unique coupon code that customers will use (e.g., 'SAVE20', 'WELCOME10')"),
		name: z.string().describe("Display name for the coupon (e.g., '20% Off Spring Cleaning')"),
		description: z.string().optional().describe("Optional detailed description of the coupon and its terms"),
		discount_type: z.enum(["percentage", "fixed_amount"]).describe("Type of discount: 'percentage' for % off or 'fixed_amount' for dollar amount off"),
		discount_value: z.number().describe("Discount value: percentage (0-100) if percentage type, or dollar amount if fixed_amount type"),
		valid_from: z.string().optional().describe("Date when coupon becomes valid (ISO 8601 format: YYYY-MM-DD)"),
		valid_until: z.string().optional().describe("Date when coupon expires (ISO 8601 format: YYYY-MM-DD)"),
		max_uses: z.number().optional().describe("Maximum number of times this coupon can be used across all customers"),
		min_order_value: z.number().optional().describe("Minimum order value required to use this coupon (in dollars)"),
	},
	handler: async (params, apiKey) => {
		const result = await makeZenbookerRequest("/coupons", "POST", params, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All coupon tools exported as an array
 */
export const couponTools = [
	createCouponTool,
] as const;