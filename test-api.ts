#!/usr/bin/env node
/**
 * Simple script to test the Zenbooker API and understand customer data structure
 */

const TEST_API_KEY = process.env.ZENBOOKER_API_KEY;

if (!TEST_API_KEY) {
    console.error('ZENBOOKER_API_KEY environment variable not set');
    process.exit(1);
}

async function testListCustomers() {
    try {
        console.log('Testing list customers endpoint...');
        
        const response = await fetch('https://api.zenbooker.com/v1/customers?limit=2', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}): ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log('Customer data structure:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.data && data.data.length > 0) {
            console.log('\nFirst customer fields:');
            console.log(Object.keys(data.data[0]));
        }
        
    } catch (error) {
        console.error('Error testing list customers:', error);
    }
}

async function testCreateCustomer() {
    try {
        console.log('\nTesting create customer endpoint with first_name/last_name...');
        
        const response = await fetch('https://api.zenbooker.com/v1/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                first_name: 'Test',
                last_name: 'Customer'
            })
        });

        console.log(`Response status: ${response.status}`);
        const data = await response.text();
        console.log('Response:', data);
        
    } catch (error) {
        console.error('Error testing create customer:', error);
    }
}

async function testCreateCustomerWithName() {
    try {
        console.log('\nTesting create customer endpoint with name field...');
        
        const response = await fetch('https://api.zenbooker.com/v1/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Customer'
            })
        });

        console.log(`Response status: ${response.status}`);
        const data = await response.text();
        console.log('Response:', data);
        
    } catch (error) {
        console.error('Error testing create customer with name:', error);
    }
}

async function main() {
    await testListCustomers();
    await testCreateCustomer();
    await testCreateCustomerWithName();
}

main().catch(console.error);
