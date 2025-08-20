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

describe('Error Handling and Edge Cases', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('API Authentication Errors', () => {
		it('should handle 401 Unauthorized error', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 401,
				text: () => Promise.resolve('{"error": "Invalid API key"}'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, 'invalid-key')
			).rejects.toThrow('Zenbooker API Error (401): {"error": "Invalid API key"}');
		});

		it('should handle 403 Forbidden error', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 403,
				text: () => Promise.resolve('{"error": "Insufficient permissions"}'),
			});

			await expect(
				makeZenbookerRequest('/admin/settings', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (403): {"error": "Insufficient permissions"}');
		});
	});

	describe('Validation Errors', () => {
		it('should handle 400 Bad Request for invalid customer data', async () => {
			const invalidCustomerData = {
				first_name: '', // Empty required field
				email: 'invalid-email' // Invalid email format
			};

			(fetch as any).mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve('{"error": "Validation failed", "details": {"first_name": "is required", "email": "invalid format"}}'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'POST', invalidCustomerData, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (400)');
		});

		it('should handle 422 Unprocessable Entity for business logic errors', async () => {
			const duplicateCustomerData = {
				first_name: 'John',
				last_name: 'Doe',
				email: 'existing@example.com'
			};

			(fetch as any).mockResolvedValue({
				ok: false,
				status: 422,
				text: () => Promise.resolve('{"error": "Email already exists"}'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'POST', duplicateCustomerData, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (422): {"error": "Email already exists"}');
		});
	});

	describe('Resource Not Found Errors', () => {
		it('should handle 404 for non-existent customer', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('{"error": "Customer not found"}'),
			});

			await expect(
				makeZenbookerRequest('/customers/nonexistent-id', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (404): {"error": "Customer not found"}');
		});

		it('should handle 404 for non-existent job', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('{"error": "Job not found"}'),
			});

			await expect(
				makeZenbookerRequest('/jobs/invalid-job-id', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (404): {"error": "Job not found"}');
		});
	});

	describe('Rate Limiting', () => {
		it('should handle 429 Too Many Requests', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 429,
				text: () => Promise.resolve('{"error": "Rate limit exceeded", "retry_after": 60}'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (429): {"error": "Rate limit exceeded", "retry_after": 60}');
		});
	});

	describe('Server Errors', () => {
		it('should handle 500 Internal Server Error', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('{"error": "Internal server error"}'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (500): {"error": "Internal server error"}');
		});

		it('should handle 502 Bad Gateway', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 502,
				text: () => Promise.resolve('Bad Gateway'),
			});

			await expect(
				makeZenbookerRequest('/invoices', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (502): Bad Gateway');
		});

		it('should handle 503 Service Unavailable', async () => {
			(fetch as any).mockResolvedValue({
				ok: false,
				status: 503,
				text: () => Promise.resolve('{"error": "Service temporarily unavailable"}'),
			});

			await expect(
				makeZenbookerRequest('/jobs', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Zenbooker API Error (503): {"error": "Service temporarily unavailable"}');
		});
	});

	describe('Network and Timeout Errors', () => {
		it('should handle network connection errors', async () => {
			(fetch as any).mockRejectedValue(new Error('ECONNREFUSED'));

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('ECONNREFUSED');
		});

		it('should handle timeout errors', async () => {
			(fetch as any).mockRejectedValue(new Error('Request timeout'));

			await expect(
				makeZenbookerRequest('/jobs', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Request timeout');
		});

		it('should handle DNS resolution errors', async () => {
			(fetch as any).mockRejectedValue(new Error('ENOTFOUND api.zenbooker.com'));

			await expect(
				makeZenbookerRequest('/territories', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('ENOTFOUND api.zenbooker.com');
		});
	});

	describe('Response Parsing Errors', () => {
		it('should handle invalid JSON responses', async () => {
			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new Error('Unexpected token')),
				text: () => Promise.resolve('Invalid JSON'),
			});

			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY)
			).rejects.toThrow('Unexpected token');
		});

		it('should handle empty response body', async () => {
			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(null),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/customers', 'GET', undefined, TEST_API_KEY);
			expect(result).toBeNull();
		});
	});

	describe('Input Validation', () => {
		it('should reject undefined API key', async () => {
			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, undefined)
			).rejects.toThrow('Zenbooker API key is required');
		});

		it('should reject empty string API key', async () => {
			await expect(
				makeZenbookerRequest('/customers', 'GET', undefined, '')
			).rejects.toThrow('Zenbooker API key is required');
		});

		it('should handle malformed endpoint paths', async () => {
			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
				text: () => Promise.resolve(''),
			});

			// Should still work with malformed paths - fetch will handle the URL construction
			await makeZenbookerRequest('//customers///', 'GET', undefined, TEST_API_KEY);
			
			expect(fetch).toHaveBeenCalledWith(
				'https://api.zenbooker.com/v1//customers///',
				expect.any(Object)
			);
		});
	});

	describe('Large Response Handling', () => {
		it('should handle large response bodies', async () => {
			// Create a large mock response
			const largeResponse = {
				cursor: 0,
				results: Array.from({ length: 100 }, (_, i) => ({
					id: `cust_${i}`,
					first_name: `Customer${i}`,
					last_name: 'Test',
					email: `customer${i}@example.com`,
					// Add more fields to make the response larger
					notes: 'A'.repeat(1000) // 1KB of notes per customer
				})),
				count: 100,
				has_more: true,
				next_cursor: 100
			};

			(fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(largeResponse),
				text: () => Promise.resolve(''),
			});

			const result = await makeZenbookerRequest('/customers?limit=100', 'GET', undefined, TEST_API_KEY);
			
			expect(result).toEqual(largeResponse);
			expect(result.results).toHaveLength(100);
		});
	});
});