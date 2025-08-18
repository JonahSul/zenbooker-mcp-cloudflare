import { vi } from 'vitest';

// Global test environment setup
globalThis.fetch = vi.fn();

// Mock environment variables
process.env.ZENBOOKER_API_KEY = 'test-api-key-123';

// Setup common test utilities
export const TEST_API_KEY = 'test-api-key-123';
export const ZENBOOKER_API_BASE = 'https://api.zenbooker.com/v1';
