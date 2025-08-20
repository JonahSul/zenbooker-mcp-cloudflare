/**
 * Main index file exporting all Zenbooker MCP tools
 */

// Export all tool modules
export * from "./base.js";
export * from "./jobs.js";
export * from "./customers.js";
export * from "./invoices.js";
export * from "./transactions.js";
export * from "./team-members.js";
export * from "./recurring-bookings.js";
export * from "./territories.js";
export * from "./coupons.js";
export * from "./scheduling.js";

// Memory system integration
export * from "../../memory-system/index.js";

// Import all tool arrays
import { jobsTools } from "./jobs.js";
import { customerTools } from "./customers.js";
import { invoiceTools } from "./invoices.js";
import { transactionTools } from "./transactions.js";
import { teamMemberTools } from "./team-members.js";
import { recurringBookingTools } from "./recurring-bookings.js";
import { territoryTools } from "./territories.js";
import { couponTools } from "./coupons.js";
import { schedulingTools } from "./scheduling.js";
import { memoryTools } from "../../memory-system/index.js";

/**
 * All available tools grouped by category
 */
export const toolsByCategory = {
	jobs: jobsTools,
	customers: customerTools,
	invoices: invoiceTools,
	transactions: transactionTools,
	teamMembers: teamMemberTools,
	recurringBookings: recurringBookingTools,
	territories: territoryTools,
	coupons: couponTools,
	scheduling: schedulingTools,
	memory: memoryTools,
} as const;

/**
 * Flat array of all available tools
 */
export const allTools = [
	...jobsTools,
	...customerTools,
	...invoiceTools,
	...transactionTools,
	...teamMemberTools,
	...recurringBookingTools,
	...territoryTools,
	...couponTools,
	...schedulingTools,
	...memoryTools,
] as const;

/**
 * Tool registry for easy lookup by name
 */
export const toolRegistry = Object.fromEntries(
	allTools.map(tool => [tool.name, tool])
) as Record<string, typeof allTools[number]>;