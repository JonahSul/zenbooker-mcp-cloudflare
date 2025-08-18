import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZenbookerMCP } from '../src/index';
import { TEST_API_KEY } from './setup';

// Import the helper function directly for testing
const makeZenbookerRequest = async (
	endpoint: string,
	method: string = "GET",
	body?: any,
	apiKey?: string
) => {
	// This is a copy of the helper function for testing
	// Try to get API key from parameter, then global
	const effectiveApiKey = apiKey || ZenbookerMCP.getApiKey();
	
	if (!effectiveApiKey) {
		throw new Error("Zenbooker API key is required. Please set the ZENBOOKER_API_KEY environment variable.");
	}

	const url = `https://api.zenbooker.com/v1${endpoint}`;
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
};

describe('API Key Management', () => {
  beforeEach(async () => {
    // Reset global state
    ZenbookerMCP.setApiKey(undefined);
    vi.clearAllMocks();
  });

  it('should set and get API key correctly', () => {
    expect(ZenbookerMCP.getApiKey()).toBeUndefined();
    
    ZenbookerMCP.setApiKey(TEST_API_KEY);
    expect(ZenbookerMCP.getApiKey()).toBe(TEST_API_KEY);
  });

  it('should fail when no API key is set', async () => {
    // Ensure no API key is set
    ZenbookerMCP.setApiKey(undefined);
    
    // Mock fetch to not be called
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    
    // Try to call makeZenbookerRequest without API key
    await expect(makeZenbookerRequest('/customers', 'POST', {
      first_name: 'John',
      last_name: 'Doe'
    })).rejects.toThrow('Zenbooker API key is required');
    
    // Verify fetch was never called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should make API call when API key is set via static method', async () => {
    // Set API key via static method
    ZenbookerMCP.setApiKey(TEST_API_KEY);
    
    // Mock successful API response
    const mockResponse = {
      id: 'cust_123',
      first_name: 'John',
      last_name: 'Doe'
    };
    
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    // Call makeZenbookerRequest with API key set globally
    const result = await makeZenbookerRequest('/customers', 'POST', {
      first_name: 'John',
      last_name: 'Doe'
    });
    
    // Verify fetch was called with correct parameters
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.zenbooker.com/v1/customers',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${TEST_API_KEY}`,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe'
        })
      })
    );
    
    expect(result).toEqual(mockResponse);
  });

  it('should make API call when API key is passed directly', async () => {
    // Don't set global API key
    ZenbookerMCP.setApiKey(undefined);
    
    // Mock successful API response
    const mockResponse = { id: 'cust_456' };
    
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    // Call makeZenbookerRequest with API key passed directly
    const result = await makeZenbookerRequest('/customers', 'POST', {
      first_name: 'Jane',
      last_name: 'Smith'
    }, TEST_API_KEY);
    
    // Verify fetch was called with the directly passed API key
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.zenbooker.com/v1/customers',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${TEST_API_KEY}`
        })
      })
    );
    
    expect(result).toEqual(mockResponse);
  });
});
