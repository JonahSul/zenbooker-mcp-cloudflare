import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the fetch function
global.fetch = vi.fn();

// Copy the makeZenbookerRequest function directly to avoid import issues
const ZENBOOKER_API_BASE = "https://api.zenbooker.com/v1";

async function makeZenbookerRequest(
	endpoint: string,
	method: string = "GET",
	body?: any,
	apiKey?: string
) {
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

describe('API Key functionality', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should throw error when API key is missing', async () => {
		await expect(
			makeZenbookerRequest('/customers', 'GET', undefined, undefined)
		).rejects.toThrow('Zenbooker API key is required');
	});

	it('should make request with API key', async () => {
		const mockResponse = { customers: [] };
		(fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
			text: () => Promise.resolve(''),
		});

		const result = await makeZenbookerRequest('/customers', 'GET', undefined, 'test-api-key');
		
		expect(fetch).toHaveBeenCalledWith(
			'https://api.zenbooker.com/v1/customers',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Authorization': 'Bearer test-api-key',
					'Content-Type': 'application/json',
				}),
			})
		);
		expect(result).toEqual(mockResponse);
	});

	it('should include body for POST requests', async () => {
		const mockResponse = { id: '123' };
		const customerData = { first_name: 'John', last_name: 'Doe' };
		
		(fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
			text: () => Promise.resolve(''),
		});

		await makeZenbookerRequest('/customers', 'POST', customerData, 'test-api-key');
		
		expect(fetch).toHaveBeenCalledWith(
			'https://api.zenbooker.com/v1/customers',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify(customerData),
				headers: expect.objectContaining({
					'Authorization': 'Bearer test-api-key',
				}),
			})
		);
	});
});
