/**
 * Type definitions for Zenbooker API responses
 * 
 * These types provide better type safety and documentation for the API responses
 * used throughout the MCP server implementation.
 */

// Generic API response interface
export interface ApiResponse {
	[key: string]: unknown;
}

// Base pagination response structure
export interface PaginatedResponse<T> {
	cursor: number;
	results: T[];
	count: number;
	has_more: boolean;
	next_cursor: number | null;
}

// Customer related types
export interface Customer {
	id: string;
	first_name: string;
	last_name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export type CustomersResponse = PaginatedResponse<Customer>;

// Job related types
export interface Job {
	id: string;
	customer_id: string;
	status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
	scheduled_at: string;
	duration_minutes?: number;
	description?: string;
	service_type?: string;
	assigned_team_member_id?: string;
	address?: string;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export type JobsResponse = PaginatedResponse<Job>;

// Invoice related types
export interface Invoice {
	id: string;
	customer_id: string;
	job_id?: string;
	status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
	amount: number;
	currency: string;
	due_date?: string;
	description?: string;
	line_items?: InvoiceLineItem[];
	created_at: string;
	updated_at: string;
}

export interface InvoiceLineItem {
	id: string;
	description: string;
	quantity: number;
	unit_price: number;
	total: number;
}

export type InvoicesResponse = PaginatedResponse<Invoice>;

// Transaction related types
export interface Transaction {
	id: string;
	customer_id: string;
	invoice_id?: string;
	amount: number;
	currency: string;
	type: 'payment' | 'refund' | 'adjustment';
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	payment_method?: string;
	reference?: string;
	created_at: string;
	updated_at: string;
}

export type TransactionsResponse = PaginatedResponse<Transaction>;

// Team member related types
export interface TeamMember {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone?: string;
	role: string;
	active: boolean;
	skills?: string[];
	territories?: string[];
	created_at: string;
	updated_at: string;
}

export type TeamMembersResponse = PaginatedResponse<TeamMember>;

// Recurring booking related types
export interface RecurringBooking {
	id: string;
	customer_id: string;
	service_type: string;
	frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
	day_of_week?: number;
	time: string;
	duration_minutes: number;
	active: boolean;
	next_scheduled_date?: string;
	created_at: string;
	updated_at: string;
}

export type RecurringBookingsResponse = PaginatedResponse<RecurringBooking>;

// Territory related types
export interface Territory {
	id: string;
	name: string;
	description?: string;
	zip_codes?: string[];
	cities?: string[];
	states?: string[];
	active: boolean;
	created_at: string;
	updated_at: string;
}

export type TerritoriesResponse = PaginatedResponse<Territory>;

// Coupon related types
export interface Coupon {
	id: string;
	code: string;
	name: string;
	description?: string;
	discount_type: 'percentage' | 'fixed_amount';
	discount_value: number;
	valid_from?: string;
	valid_until?: string;
	max_uses?: number;
	uses_count: number;
	min_order_value?: number;
	active: boolean;
	created_at: string;
	updated_at: string;
}

// Error response types
export interface ApiError {
	error: string;
	message?: string;
	details?: Record<string, string>;
	code?: string;
}

// Request body types for mutations
export interface CreateCustomerRequest {
	first_name: string;
	last_name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	notes?: string;
}

export interface UpdateCustomerRequest {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	notes?: string;
}

export interface CreateCouponRequest {
	code: string;
	name: string;
	description?: string;
	discount_type: 'percentage' | 'fixed_amount';
	discount_value: number;
	valid_from?: string;
	valid_until?: string;
	max_uses?: number;
	min_order_value?: number;
}

// Query parameter types
export interface PaginationParams {
	cursor?: number;
	limit?: number;
}

export interface JobFilters extends PaginationParams {
	customer_id?: string;
	status?: string;
	start_date?: string;
	end_date?: string;
}

export interface CustomerFilters extends PaginationParams {
	search?: string;
	email?: string;
	phone?: string;
}

export interface InvoiceFilters extends PaginationParams {
	customer_id?: string;
	status?: string;
	start_date?: string;
	end_date?: string;
}

export interface TransactionFilters extends PaginationParams {
	customer_id?: string;
	invoice_id?: string;
	start_date?: string;
	end_date?: string;
}

export interface TeamMemberFilters extends PaginationParams {
	active?: boolean;
}

export interface RecurringBookingFilters extends PaginationParams {
	customer_id?: string;
	active?: boolean;
}

export interface TerritoryFilters extends PaginationParams {
	// No additional filters for territories currently
}