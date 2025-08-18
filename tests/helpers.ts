import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock MCP Client for testing
export class MockMcpClient {
  private tools: Map<string, any> = new Map();
  
  constructor(private server: McpServer) {}

  // Simulate MCP tool registration
  async loadTools() {
    // Get all tools from the server
    const toolsList = await this.server.list_tools();
    
    for (const tool of toolsList.tools) {
      this.tools.set(tool.name, tool);
    }
    
    return Array.from(this.tools.keys());
  }

  // Simulate calling a tool
  async callTool(name: string, arguments_: any = {}) {
    if (!this.tools.has(name)) {
      throw new Error(`Tool '${name}' not found`);
    }

    try {
      const result = await this.server.call_tool({
        name,
        arguments: arguments_
      });
      
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get tool schema for validation testing
  getToolSchema(name: string) {
    return this.tools.get(name)?.inputSchema;
  }

  // List all available tools
  listTools() {
    return Array.from(this.tools.keys());
  }

  // Check if a tool exists
  hasTool(name: string) {
    return this.tools.has(name);
  }
}

// Test helper for creating an initialized MCP server
export async function createTestMcpServer(apiKey: string = 'test-api-key-123') {
  // We need to import the actual class, but we'll do it dynamically
  // to avoid import issues during testing
  const { ZenbookerMCP } = await import('../src/index.js');
  
  // Set the API key globally
  ZenbookerMCP.setApiKey(apiKey);
  
  // Create and initialize the server
  const mcpAgent = new ZenbookerMCP();
  await mcpAgent.init();
  
  return mcpAgent.server;
}

// Helper to create a mock environment for Cloudflare Workers
export function createMockEnv(apiKey: string = 'test-api-key-123') {
  return {
    ZENBOOKER_API_KEY: apiKey
  };
}

// Helper to create a mock execution context
export function createMockExecutionContext() {
  return {
    waitUntil: (promise: Promise<any>) => promise,
    passThroughOnException: () => {}
  };
}

// Test validation helpers
export function validateMcpResponse(response: any) {
  expect(response).toBeDefined();
  expect(response.content).toBeDefined();
  expect(Array.isArray(response.content)).toBe(true);
  expect(response.content.length).toBeGreaterThan(0);
  expect(response.content[0]).toHaveProperty('type', 'text');
  expect(response.content[0]).toHaveProperty('text');
}

export function validateJsonResponse(response: any) {
  validateMcpResponse(response);
  
  const text = response.content[0].text;
  expect(() => JSON.parse(text)).not.toThrow();
  
  return JSON.parse(text);
}

export function validatePaginatedResponse(response: any) {
  const data = validateJsonResponse(response);
  
  expect(data).toHaveProperty('cursor');
  expect(data).toHaveProperty('results');
  expect(data).toHaveProperty('count');
  expect(data).toHaveProperty('has_more');
  expect(data).toHaveProperty('next_cursor');
  expect(Array.isArray(data.results)).toBe(true);
  
  return data;
}

export function validateErrorResponse(response: any, expectedMessage?: string) {
  validateMcpResponse(response);
  
  const text = response.content[0].text;
  expect(text).toContain('Error');
  
  if (expectedMessage) {
    expect(text).toContain(expectedMessage);
  }
}
