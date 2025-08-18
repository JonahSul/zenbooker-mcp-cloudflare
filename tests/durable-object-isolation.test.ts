import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulate the global variable issue
let globalApiKey: string | undefined;

// Mock McpAgent behavior
class MockMcpAgent {
  static setApiKey(key?: string) {
    globalApiKey = key;
  }
  
  static getApiKey(): string | undefined {
    return globalApiKey;
  }
}

// Simulate what happens in a Durable Object context
class MockDurableObjectContext {
  // In a real Durable Object, global variables from the main Worker don't persist
  private isolatedGlobalApiKey: string | undefined = undefined;
  
  simulateToolExecution(apiKey?: string): string {
    // This simulates what happens when a tool tries to access the global API key
    const effectiveApiKey = apiKey || this.isolatedGlobalApiKey;
    
    if (!effectiveApiKey) {
      throw new Error("Zenbooker API key is required. Please set the ZENBOOKER_API_KEY environment variable.");
    }
    
    return effectiveApiKey;
  }
  
  setApiKey(key?: string) {
    this.isolatedGlobalApiKey = key;
  }
}

describe('Durable Object API Key Issue', () => {
  beforeEach(() => {
    globalApiKey = undefined;
  });

  it('should demonstrate the isolation problem', () => {
    // Main Worker sets the API key
    MockMcpAgent.setApiKey('test-api-key');
    expect(MockMcpAgent.getApiKey()).toBe('test-api-key');
    
    // But in Durable Object context, this is isolated
    const durableObjectContext = new MockDurableObjectContext();
    
    // This should fail because the Durable Object doesn't have access to the main Worker's global
    expect(() => durableObjectContext.simulateToolExecution()).toThrow('Zenbooker API key is required');
  });

  it('should work when API key is passed directly to the context', () => {
    const durableObjectContext = new MockDurableObjectContext();
    durableObjectContext.setApiKey('test-api-key');
    
    // This should work because we set it in the Durable Object's context
    expect(durableObjectContext.simulateToolExecution()).toBe('test-api-key');
  });

  it('should work when API key is passed as parameter', () => {
    const durableObjectContext = new MockDurableObjectContext();
    
    // This should work because we pass it directly
    expect(durableObjectContext.simulateToolExecution('test-api-key')).toBe('test-api-key');
  });
});
