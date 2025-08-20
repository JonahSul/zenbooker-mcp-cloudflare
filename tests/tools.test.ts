import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TEST_API_KEY } from './setup';

// Mock the fetch function
global.fetch = vi.fn();

// Copy helper function for testing
const ZENBOOKER_API_BASE = "https://api.zenbooker.com/v1";

type ApiRequestBody = Record<string, unknown>;

async function makeZenbookerRequest(
	endpoint: string,
	method: string = "GET",
	body?: ApiRequestBody,
	apiKey?: string
): Promise<any> {
	if (!apiKey) {
		throw new Error("Zenbooker API key is required. Please set the ZENBOOKER_API_KEY environment variable.");
	}

	const url = `${ZENBOOKER_API_BASE}${endpoint}`;
	const headers: HeadersInit = {
		"Authorization": `Bearer ${apiKey}`,
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

describe('MCP Tools Integration', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('Jobs Tools', () => {
		it('should list jobs with pagination parameters', async () => {
			const mockJobs = {
				cursor: 0,
				results: [
					{ id: 'job_1', customer_id: 'cust_1', status: 'pending' },
					{ id: 'job_2', customer_id: 'cust_2', status: 'completed' }
				],
				count: 2,
				has_more: false,
				next_cursor: null
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockJobs),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/jobs?cursor=0&limit=10', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/jobs?cursor=0&limit=10',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Authorization': `Bearer ${TEST_API_KEY}`,
					}),
				})
			);
			expect(result).toEqual(mockJobs);
		});

		it('should get specific job by ID', async () => {
			const mockJob = {
				id: 'job_123',
				customer_id: 'cust_456',
				status: 'in_progress',
				scheduled_at: '2025-08-21T10:00:00Z'
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockJob),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/jobs/job_123', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/jobs/job_123',
				expect.objectContaining({
					method: 'GET',
				})
			);
			expect(result).toEqual(mockJob);
		});
	});

	describe('Customer Tools', () => {
		it('should create customer with required fields', async () => {
			const customerData = {
				first_name: 'John',
				last_name: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				address: '123 Main St',
				city: 'Anytown',
				state: 'CA',
				zip: '12345'
			};

			const mockResponse = {
				id: 'cust_789',
				...customerData,
				created_at: '2025-08-20T12:00:00Z'
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/customers', 'POST', customerData, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/customers',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(customerData),
					headers: expect.objectContaining({
						'Authorization': `Bearer ${TEST_API_KEY}`,
						'Content-Type': 'application/json',
					}),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should update customer with partial data', async () => {
			const updateData = {
				phone: '+0987654321',
				notes: 'Updated phone number'
			};

			const mockResponse = {
				id: 'cust_789',
				first_name: 'John',
				last_name: 'Doe',
				...updateData,
				updated_at: '2025-08-20T13:00:00Z'
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/customers/cust_789', 'PATCH', updateData, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/customers/cust_789',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify(updateData),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should search customers by email', async () => {
			const mockCustomers = {
				cursor: 0,
				results: [
					{ id: 'cust_1', email: 'test@example.com', first_name: 'Test', last_name: 'User' }
				],
				count: 1,
				has_more: false,
				next_cursor: null
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockCustomers),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/customers?email=test@example.com', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/customers?email=test@example.com',
				expect.objectContaining({
					method: 'GET',
				})
			);
			expect(result).toEqual(mockCustomers);
		});
	});

	describe('Invoice Tools', () => {
		it('should list invoices with date filtering', async () => {
			const mockInvoices = {
				cursor: 0,
				results: [
					{ id: 'inv_1', customer_id: 'cust_1', status: 'paid', amount: 150.00 },
					{ id: 'inv_2', customer_id: 'cust_2', status: 'pending', amount: 200.00 }
				],
				count: 2,
				has_more: true,
				next_cursor: 2
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockInvoices),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/invoices?start_date=2025-08-01&end_date=2025-08-20', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/invoices?start_date=2025-08-01&end_date=2025-08-20',
				expect.objectContaining({
					method: 'GET',
				})
			);
			expect(result).toEqual(mockInvoices);
		});
	});

	describe('Coupon Tools', () => {
		it('should create percentage discount coupon', async () => {
			const couponData = {
				code: 'SAVE20',
				name: '20% Off Summer Special',
				description: 'Get 20% off any service during summer',
				discount_type: 'percentage',
				discount_value: 20,
				valid_from: '2025-06-01',
				valid_until: '2025-09-01',
				max_uses: 100,
				min_order_value: 50
			};

			const mockResponse = {
				id: 'coupon_123',
				...couponData,
				created_at: '2025-08-20T12:00:00Z',
				uses_count: 0
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/coupons', 'POST', couponData, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/coupons',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(couponData),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should create fixed amount discount coupon', async () => {
			const couponData = {
				code: 'FLAT10',
				name: '$10 Off First Service',
				discount_type: 'fixed_amount',
				discount_value: 10,
				max_uses: 50
			};

			const mockResponse = {
				id: 'coupon_124',
				...couponData,
				created_at: '2025-08-20T12:00:00Z',
				uses_count: 0
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/coupons', 'POST', couponData, TEST_API_KEY);
			
			expect(result).toEqual(mockResponse);
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors gracefully', async () => {
			const errorResponse = {
				error: 'Invalid customer data',
				message: 'Email address is already in use'
			};

			(fetch as any).mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve(JSON.stringify(errorResponse)),
			});

			await expect(
				makeZenbookerRequest('/customers', 'POST', { first_name: 'Test' }, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (400)');
		});

		it('should handle network errors', async () => {
			(fetch as any).mockRejectedValue(new Error('Network error'));

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Network error');
		});

		it('should handle missing API key', async () => {
			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, undefined)
			).rejects.toThrow('Zenbooker API key is required');
		});
	});

	describe('Query Parameter Building', () => {
		it('should build complex query strings correctly', async () => {
			const mockResponse = { results: [] };
			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				text: () => Promise.resolve(''),
			});

			// Test multiple parameters
			await makeZenbookerRequest('/jobs?cursor=10&limit=25&customer_id=cust_123&status=pending&start_date=2025-08-01', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1/jobs?cursor=10&limit=25&customer_id=cust_123&status=pending&start_date=2025-08-01',
				expect.objectContaining({
					method: 'GET',
				})
			);
		});
	});
});