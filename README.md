# Zenbooker MCP Server on Cloudflare Workers

This MCP server provides comprehensive access to the Zenbooker API for home service businesses. It includes tools for managing jobs, customers, invoices, transactions, team members, recurring bookings, territories, and coupons.

## 🤖 For AI Assistants: READ .cursorrules FIRST

**Before making any changes to this project, always read the [`.cursorrules`](.cursorrules) file.** It contains critical development axioms, architecture lessons learned, and project-specific patterns that must be followed.

## ⚠️ Important: API Key Required

This server requires a Zenbooker API key to function. See the [Environment Variables](#environment-variables) section below.

## Get started: 

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

This will deploy your MCP server to a URL like: `remote-mcp-server-authless.<your-account>.workers.dev/sse`

Alternatively, you can use the command line below to get the remote MCP Server created on your local machine:
```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

## Environment Variables

Before deploying or running locally, you must set your Zenbooker API key:

### For Local Development
```bash
cp .env.example .env
# Edit .env and set your ZENBOOKER_API_KEY
```

### For Cloudflare Workers Deployment
```bash
wrangler secret put ZENBOOKER_API_KEY
# Enter your Zenbooker API key when prompted
```

### Getting a Zenbooker API Key
1. Log into your Zenbooker admin panel
2. Navigate to Settings > Developers > API  
3. Click "Create API Key"
4. Copy the generated key

## Available Tools

The server provides 13 different tools for interacting with the Zenbooker API:

### Jobs
- `list_jobs` - List jobs with filtering options
- `get_job` - Get specific job details

### Customers  
- `list_customers` - List customers with search/filtering
- `get_customer` - Get specific customer details
- `create_customer` - Create new customers
- `update_customer` - Update existing customers

### Invoices
- `list_invoices` - List invoices with filtering
- `get_invoice` - Get specific invoice details

### Other Resources
- `list_transactions` - List payment transactions
- `list_team_members` - List service providers/staff
- `list_recurring_bookings` - List scheduled recurring services
- `list_territories` - List service areas
- `create_coupon` - Create discount coupons

For detailed parameter information, see [ZENBOOKER_README.md](./ZENBOOKER_README.md).

## Customizing your MCP Server

To add your own [tools](https://developers.cloudflare.com/agents/model-context-protocol/tools/) to the MCP server, define each tool inside the `init()` method of `src/index.ts` using `this.server.tool(...)`. 

## Connect to Cloudflare AI Playground

You can connect to your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`remote-mcp-server-authless.<your-account>.workers.dev/sse`)
3. You can now use your MCP tools directly from the playground!

## Connect Claude Desktop to your MCP server

You can also connect to your remote MCP server from local MCP clients, by using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote). 

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "zenbooker": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or remote-mcp-server-authless.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the Zenbooker tools become available. 
