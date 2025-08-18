# Zenbooker MCP Server

This MCP server provides comprehensive access to the Zenbooker API, allowing you to interact with jobs, customers, invoices, transactions, team members, recurring bookings, territories, and coupons.

## Setup

### Environment Variables

You must set the following environment variable:

```bash
ZENBOOKER_API_KEY=your_zenbooker_api_key_here
```

### Getting a Zenbooker API Key

1. Log into your Zenbooker admin panel
2. Navigate to Settings > Developers > API
3. Click "Create API Key"
4. Copy the generated key

## Available Tools

### Jobs

- **`list_jobs`** - Retrieve a list of jobs with optional filtering
  - Parameters: `cursor`, `limit`, `customer_id`, `status`, `start_date`, `end_date`
  
- **`get_job`** - Get a specific job by ID
  - Parameters: `id`

### Customers

- **`list_customers`** - Retrieve a list of customers with optional filtering
  - Parameters: `cursor`, `limit`, `search`, `email`, `phone`
  
- **`get_customer`** - Get a specific customer by ID
  - Parameters: `id`
  
- **`create_customer`** - Create a new customer
  - Parameters: `first_name`, `last_name`, `email` (optional), `phone` (optional), `address` (optional), `city` (optional), `state` (optional), `zip` (optional), `notes` (optional)
  
- **`update_customer`** - Update an existing customer
  - Parameters: `id`, and any customer fields to update

### Invoices

- **`list_invoices`** - Retrieve a list of invoices with optional filtering
  - Parameters: `cursor`, `limit`, `customer_id`, `status`, `start_date`, `end_date`
  
- **`get_invoice`** - Get a specific invoice by ID
  - Parameters: `id`

### Transactions

- **`list_transactions`** - Retrieve a list of transactions with optional filtering
  - Parameters: `cursor`, `limit`, `customer_id`, `invoice_id`, `start_date`, `end_date`

### Team Members

- **`list_team_members`** - Retrieve a list of team members
  - Parameters: `cursor`, `limit`, `active` (optional)

### Recurring Bookings

- **`list_recurring_bookings`** - Retrieve a list of recurring bookings (max 40 per request)
  - Parameters: `cursor`, `limit` (max 40), `customer_id`, `active`

### Territories

- **`list_territories`** - Retrieve a list of service territories
  - Parameters: `cursor`, `limit`

### Coupons

- **`create_coupon`** - Create a new coupon
  - Parameters: `code`, `name`, `description` (optional), `discount_type` ("percentage" or "fixed_amount"), `discount_value`, `valid_from` (optional), `valid_until` (optional), `max_uses` (optional), `min_order_value` (optional)

## Pagination

All list endpoints support pagination with the following parameters:
- `cursor` - Where to start in the list (defaults to 0)
- `limit` - Maximum number of results (defaults to 20, max 100, except recurring bookings which max at 40)

Responses include:
- `cursor` - Current cursor position
- `results` - Array of results
- `count` - Number of items returned
- `has_more` - Whether more results are available
- `next_cursor` - Next cursor value to use (null if at end)

## Authentication

The server uses Bearer token authentication. The API key is automatically included in all requests using the `Authorization: Bearer {API_KEY}` header.

## Error Handling

All tools will return appropriate error messages if:
- The API key is missing or invalid
- Required parameters are not provided
- The Zenbooker API returns an error
- Network issues occur

## Example Usage

Once deployed, you can use this MCP server to:

1. **Get all customers**: Use `list_customers` with optional search parameters
2. **Create a new customer**: Use `create_customer` with required name fields
3. **View recent jobs**: Use `list_jobs` with date filtering
4. **Check invoices for a customer**: Use `list_invoices` with `customer_id`
5. **Manage team members**: Use `list_team_members` to see your service providers
6. **Create promotional coupons**: Use `create_coupon` for discounts

## Development

To run locally:

```bash
npm run dev
```

To deploy:

```bash
npm run deploy
```

Make sure to set your `ZENBOOKER_API_KEY` environment variable in your Cloudflare Workers environment.

## API Reference

This MCP server is based on the Zenbooker API v1. For detailed API documentation, visit:
https://developers.zenbooker.com/reference/introduction

## Notes

- The Zenbooker API is currently in beta, so endpoints may change
- All datetime fields are in ISO 8601 format (UTC timezone)
- Jobs and recurring bookings include timezone information for local time conversion
- Rate limiting may apply based on your Zenbooker plan
