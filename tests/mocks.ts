// Mock fetch responses for Zenbooker API
export const mockApiResponses = {
  // Jobs
  jobs: {
    cursor: 0,
    results: [
      {
        id: "job_123",
        customer_id: "cust_456",
        status: "scheduled",
        start_time: "2025-08-17T10:00:00.000Z",
        end_time: "2025-08-17T12:00:00.000Z",
        service_type: "cleaning",
        notes: "Regular house cleaning"
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },
  
  job: {
    id: "job_123",
    customer_id: "cust_456",
    status: "scheduled",
    start_time: "2025-08-17T10:00:00.000Z",
    end_time: "2025-08-17T12:00:00.000Z",
    service_type: "cleaning",
    notes: "Regular house cleaning",
    address: "123 Main St, City, State 12345"
  },

  // Customers
  customers: {
    cursor: 0,
    results: [
      {
        id: "cust_456",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        city: "City",
        state: "State",
        zip: "12345"
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  customer: {
    id: "cust_456",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    city: "City",
    state: "State",
    zip: "12345",
    created_at: "2025-01-01T00:00:00.000Z"
  },

  createdCustomer: {
    id: "cust_789",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: "+1987654321",
    address: "456 Oak Ave",
    city: "Town",
    state: "State",
    zip: "54321",
    created_at: "2025-08-17T00:00:00.000Z"
  },

  // Invoices
  invoices: {
    cursor: 0,
    results: [
      {
        id: "inv_123",
        customer_id: "cust_456",
        amount: 150.00,
        status: "paid",
        due_date: "2025-08-20T00:00:00.000Z",
        created_at: "2025-08-10T00:00:00.000Z"
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  invoice: {
    id: "inv_123",
    customer_id: "cust_456",
    amount: 150.00,
    status: "paid",
    due_date: "2025-08-20T00:00:00.000Z",
    created_at: "2025-08-10T00:00:00.000Z",
    line_items: [
      {
        description: "House Cleaning Service",
        amount: 150.00
      }
    ]
  },

  // Transactions
  transactions: {
    cursor: 0,
    results: [
      {
        id: "txn_123",
        invoice_id: "inv_123",
        customer_id: "cust_456",
        amount: 150.00,
        status: "completed",
        payment_method: "credit_card",
        processed_at: "2025-08-15T14:30:00.000Z"
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  // Team Members
  teamMembers: {
    cursor: 0,
    results: [
      {
        id: "team_123",
        first_name: "Alice",
        last_name: "Johnson",
        email: "alice@company.com",
        phone: "+1555123456",
        role: "cleaner",
        active: true
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  // Recurring Bookings
  recurringBookings: {
    cursor: 0,
    results: [
      {
        id: "rec_123",
        customer_id: "cust_456",
        frequency: "weekly",
        next_occurrence: "2025-08-24T10:00:00.000Z",
        active: true,
        service_type: "cleaning"
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  // Territories
  territories: {
    cursor: 0,
    results: [
      {
        id: "terr_123",
        name: "Downtown Area",
        zip_codes: ["12345", "12346", "12347"],
        active: true
      }
    ],
    count: 1,
    has_more: false,
    next_cursor: null
  },

  // Coupons
  createdCoupon: {
    id: "coupon_123",
    code: "SAVE20",
    name: "20% Off Service",
    description: "Save 20% on your next cleaning service",
    discount_type: "percentage",
    discount_value: 20,
    valid_from: "2025-08-17T00:00:00.000Z",
    valid_until: "2025-09-17T23:59:59.000Z",
    max_uses: 100,
    current_uses: 0,
    active: true
  }
};

// Error responses
export const mockErrorResponses = {
  unauthorized: {
    status: 401,
    body: { error: "Unauthorized", message: "Invalid API key" }
  },
  notFound: {
    status: 404,
    body: { error: "Not Found", message: "Resource not found" }
  },
  badRequest: {
    status: 400,
    body: { error: "Bad Request", message: "Invalid parameters" }
  },
  rateLimited: {
    status: 429,
    body: { error: "Rate Limited", message: "Too many requests" }
  }
};

// Mock fetch implementation
export function createMockFetch() {
  return function mockFetch(url: string | URL, options?: RequestInit): Promise<Response> {
    const urlStr = url.toString();
    const method = options?.method || 'GET';
    
    // Parse URL to determine endpoint
    const pathname = new URL(urlStr).pathname;
    const searchParams = new URL(urlStr).searchParams;
    
    // Check authorization header
    const authHeader = (options?.headers as Record<string, string>)?.['Authorization'];
    if (!authHeader || !authHeader.includes('test-api-key-123')) {
      return Promise.resolve(new Response(
        JSON.stringify(mockErrorResponses.unauthorized.body),
        { status: 401 }
      ));
    }

    // Route to appropriate mock response
    if (method === 'GET') {
      if (pathname === '/v1/jobs') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.jobs)));
      }
      if (pathname.match(/^\/v1\/jobs\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.job)));
      }
      if (pathname === '/v1/customers') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.customers)));
      }
      if (pathname.match(/^\/v1\/customers\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.customer)));
      }
      if (pathname === '/v1/invoices') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.invoices)));
      }
      if (pathname.match(/^\/v1\/invoices\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.invoice)));
      }
      if (pathname === '/v1/transactions') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.transactions)));
      }
      if (pathname === '/v1/team_members') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.teamMembers)));
      }
      if (pathname === '/v1/recurring') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.recurringBookings)));
      }
      if (pathname === '/v1/territories') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.territories)));
      }
    }
    
    if (method === 'POST') {
      if (pathname === '/v1/customers') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.createdCustomer)));
      }
      if (pathname === '/v1/coupons') {
        return Promise.resolve(new Response(JSON.stringify(mockApiResponses.createdCoupon)));
      }
    }
    
    if (method === 'PATCH') {
      if (pathname.match(/^\/v1\/customers\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify({
          ...mockApiResponses.customer,
          updated_at: "2025-08-17T12:00:00.000Z"
        })));
      }
    }

    // Default to not found
    return Promise.resolve(new Response(
      JSON.stringify(mockErrorResponses.notFound.body),
      { status: 404 }
    ));
  };
}
