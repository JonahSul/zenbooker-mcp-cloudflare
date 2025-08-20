/**
 * Test the territory coverage tool directly
 */

// Simple test to check the geolib functionality
import { isPointInPolygon, getDistance } from 'geolib';

// Test coordinates for Denver, CO
const denverCoords = {
    latitude: 39.7392,
    longitude: -104.9903
};

// Test coordinates for Billings, MT
const billingsCoords = {
    latitude: 45.7833,
    longitude: -108.5007
};

// Simple polygon around Billings
const billingsPolygon = [
    { latitude: 45.9, longitude: -108.7 },
    { latitude: 45.9, longitude: -108.3 },
    { latitude: 45.6, longitude: -108.3 },
    { latitude: 45.6, longitude: -108.7 }
];

console.log('Testing geolib functionality:');
console.log('Denver in Billings polygon:', isPointInPolygon(denverCoords, billingsPolygon));
console.log('Billings in Billings polygon:', isPointInPolygon(billingsCoords, billingsPolygon));
console.log('Distance Denver to Billings:', getDistance(denverCoords, billingsCoords), 'meters');

// Test geocoding with fetch
async function testGeocoding() {
    try {
        const address = "1234 Main Street, Billings, MT";
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'ZenbookerMCP/1.0 (test)'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Raw response:', text.substring(0, 200));
        
        const data = JSON.parse(text);
        console.log('Geocoding result for', address, ':', data[0] || 'No results');
    } catch (error) {
        console.error('Geocoding error:', error.message);
    }
}

testGeocoding();
