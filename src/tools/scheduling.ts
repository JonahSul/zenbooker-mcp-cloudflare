/**
 * Scheduling management tools for the Zenbooker MCP server
 */

import { z } from "zod";
import { makeZenbookerRequest, formatToolResult, buildQueryParams, type ToolImplementation } from "./base.js";
import { isPointInPolygon, getDistance } from "geolib";
import type { Territory, TerritoriesResponse } from "../types.js";

/**
 * Interface for geographic coordinates
 */
interface Coordinates {
	latitude: number;
	longitude: number;
}

/**
 * Interface for territory with geographic boundaries
 */
interface TerritoryWithBoundaries extends Territory {
	boundaries?: Coordinates[];
	center?: Coordinates;
}

/**
 * Interface for geocoding API response from OpenStreetMap Nominatim
 */
interface GeocodingResult {
	lat: string;
	lon: string;
	display_name: string;
}

/**
 * Geocode an address to get latitude and longitude coordinates
 * Using a simple geocoding service (you may want to use a more robust service)
 */
async function geocodeAddress(address: string): Promise<Coordinates> {
	// For now, we'll use a simple approach. In production, you'd want to use
	// a proper geocoding service like Google Maps, MapBox, or similar
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
			{
				headers: {
					'User-Agent': 'ZenbookerMCP/1.0'
				}
			}
		);
		
		if (!response.ok) {
			throw new Error(`Geocoding HTTP ${response.status}: ${response.statusText}`);
		}
		
		const data: GeocodingResult[] = await response.json();
		
		if (!data || data.length === 0) {
			throw new Error(`Could not geocode address: ${address}`);
		}
		
		return {
			latitude: parseFloat(data[0].lat),
			longitude: parseFloat(data[0].lon)
		};
	} catch (error) {
		throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Create territory boundaries from zip codes and cities
 * This is a simplified approach - in practice you'd want more precise boundaries
 */
async function createTerritoryBoundaries(territory: Territory): Promise<TerritoryWithBoundaries> {
	// For now, we'll create approximate boundaries based on zip codes and cities
	// In a real implementation, you'd have actual geographic polygon data
	
	const boundaries: Coordinates[] = [];
	let center: Coordinates | undefined;
	
	try {
		// If we have zip codes, use them to define territory boundaries
		if (territory.zip_codes && territory.zip_codes.length > 0) {
			for (const zipCode of territory.zip_codes.slice(0, 5)) { // Limit to avoid rate limiting
				try {
					const coords = await geocodeAddress(zipCode);
					boundaries.push(coords);
					if (!center) {
						center = coords;
					}
				} catch (error) {
					console.warn(`Failed to geocode zip code ${zipCode}:`, error);
				}
			}
		}
		
		// If we have cities, use them as additional boundary points
		if (territory.cities && territory.cities.length > 0 && boundaries.length < 3) {
			for (const city of territory.cities.slice(0, 3)) {
				try {
					const cityAddress = territory.states && territory.states[0] 
						? `${city}, ${territory.states[0]}` 
						: city;
					const coords = await geocodeAddress(cityAddress);
					boundaries.push(coords);
					if (!center) {
						center = coords;
					}
				} catch (error) {
					console.warn(`Failed to geocode city ${city}:`, error);
				}
			}
		}
		
		// If we don't have enough points for a polygon, create a simple radius-based territory
		if (boundaries.length < 3 && center) {
			// Create a simple square around the center point (approximately 10 mile radius)
			const offset = 0.15; // roughly 10 miles in degrees
			boundaries.push(
				{ latitude: center.latitude + offset, longitude: center.longitude + offset },
				{ latitude: center.latitude + offset, longitude: center.longitude - offset },
				{ latitude: center.latitude - offset, longitude: center.longitude - offset },
				{ latitude: center.latitude - offset, longitude: center.longitude + offset }
			);
		}
		
	} catch (error) {
		console.warn(`Failed to create boundaries for territory ${territory.name}:`, error);
	}
	
	return {
		...territory,
		boundaries: boundaries.length >= 3 ? boundaries : undefined,
		center
	};
}

/**
 * Check territory coverage tool implementation
 */
export const checkTerritoryCoverageTool: ToolImplementation = {
	name: "check_territory_coverage",
	description: "Check if a given address is within one of the serviced territories. Returns territory information, service coverage status, and estimated travel times.",
	schema: {
		address: z.string().describe("The full address to check for territory coverage (street, city, state, zip)"),
	},
	handler: async (params, apiKey) => {
		try {
			// First, get the coordinates for the provided address
			const addressCoords = await geocodeAddress(params.address);
			
			// Fetch all territories from the API
			const territoriesResponse = await makeZenbookerRequest("/territories", "GET", undefined, apiKey) as unknown as TerritoriesResponse;
			
			const results = [];
			let coveredByTerritory: TerritoryWithBoundaries | null = null;
			let closestTerritory: { territory: TerritoryWithBoundaries; distance: number } | null = null;
			
			// Check each territory for coverage
			for (const territory of territoriesResponse.results) {
				if (!territory.active) continue; // Skip inactive territories
				
				const territoryWithBoundaries = await createTerritoryBoundaries(territory);
				
				// Check if the address is within the territory boundaries
				if (territoryWithBoundaries.boundaries && territoryWithBoundaries.boundaries.length >= 3) {
					const isInside = isPointInPolygon(addressCoords, territoryWithBoundaries.boundaries);
					
					if (isInside) {
						coveredByTerritory = territoryWithBoundaries;
						break; // Found coverage, no need to check other territories
					}
				}
				
				// Calculate distance to territory center for closest territory tracking
				if (territoryWithBoundaries.center) {
					const distance = getDistance(addressCoords, territoryWithBoundaries.center);
					
					if (!closestTerritory || distance < closestTerritory.distance) {
						closestTerritory = { territory: territoryWithBoundaries, distance };
					}
				}
				
				results.push({
					territory_id: territory.id,
					territory_name: territory.name,
					is_covered: false,
					distance_meters: territoryWithBoundaries.center 
						? getDistance(addressCoords, territoryWithBoundaries.center)
						: null
				});
			}
			
			// Format the response
			const response = {
				address: params.address,
				coordinates: addressCoords,
				coverage_status: coveredByTerritory ? "covered" : "not_covered",
				covered_by_territory: coveredByTerritory ? {
					id: coveredByTerritory.id,
					name: coveredByTerritory.name,
					description: coveredByTerritory.description,
					zip_codes: coveredByTerritory.zip_codes,
					cities: coveredByTerritory.cities,
					states: coveredByTerritory.states
				} : null,
				closest_territory: closestTerritory ? {
					id: closestTerritory.territory.id,
					name: closestTerritory.territory.name,
					distance_meters: closestTerritory.distance,
					distance_miles: Math.round(closestTerritory.distance * 0.000621371 * 100) / 100
				} : null,
				all_territories_checked: results.length,
				territories_analysis: results
			};
			
			return {
				content: [{
					type: "text",
					text: `🗺️ **Territory Coverage Analysis**

**📍 Address**: ${params.address}
**📊 Coverage Status**: ${response.coverage_status === "covered" ? "✅ COVERED" : "❌ NOT COVERED"}

${response.covered_by_territory ? `
**🎯 Covered by Territory**:
• **Territory**: ${response.covered_by_territory.name}
• **ID**: ${response.covered_by_territory.id}
• **Description**: ${response.covered_by_territory.description || 'N/A'}
• **Zip Codes**: ${response.covered_by_territory.zip_codes?.join(', ') || 'N/A'}
• **Cities**: ${response.covered_by_territory.cities?.join(', ') || 'N/A'}
• **States**: ${response.covered_by_territory.states?.join(', ') || 'N/A'}
` : ''}

${response.closest_territory ? `
**📏 Closest Territory**:
• **Territory**: ${response.closest_territory.name}
• **Distance**: ${response.closest_territory.distance_miles} miles
` : ''}

**📋 Analysis Summary**:
• **Coordinates**: ${response.coordinates.latitude.toFixed(6)}, ${response.coordinates.longitude.toFixed(6)}
• **Territories Analyzed**: ${response.all_territories_checked}

---
*Raw Data*: ${JSON.stringify(response, null, 2)}`
				}]
			};
			
		} catch (error) {
			return {
				content: [{
					type: "text",
					text: `❌ **Error checking territory coverage**: ${error instanceof Error ? error.message : 'Unknown error'}`
				}],
				isError: true
			};
		}
	}
};

/**
 * Get available appointments tool implementation
 */
export const getAvailableAppointmentsTool: ToolImplementation = {
	name: "get_available_appointments",
	description: "Determine the next available appointment times for a given address based on territory coverage and team member availability. Returns up to 10 appointment slots with team member details.",
	schema: {
		address: z.string().describe("The full address where service is requested (street, city, state, zip)"),
		service_duration: z.number().min(15).max(480).describe("Expected service duration in minutes (15-480 minutes)"),
		limit: z.number().min(1).max(10).optional().describe("Maximum number of appointment slots to return (1-10, defaults to 10)"),
		start_date: z.string().optional().describe("Earliest date to search for appointments (ISO 8601 format: YYYY-MM-DD, defaults to today)"),
	},
	handler: async (params, apiKey) => {
		// Set default limit if not provided
		const paramsWithDefaults = {
			...params,
			limit: params.limit || 10
		};
		
		const queryParams = buildQueryParams(paramsWithDefaults);
		const endpoint = `/scheduling/available-appointments?${queryParams.toString()}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * Check adjacent territories tool implementation
 */
export const checkAdjacentTerritoresTool: ToolImplementation = {
	name: "check_adjacent_territories",
	description: "For addresses outside all serviced territories, find nearby territories that could potentially be expanded to cover the address. Useful for business expansion planning.",
	schema: {
		address: z.string().describe("The full address to check for adjacent territories (street, city, state, zip)"),
		max_distance: z.number().min(1).max(50).optional().describe("Maximum distance in miles to search for adjacent territories (1-50 miles, defaults to 10)"),
	},
	handler: async (params, apiKey) => {
		const queryParams = buildQueryParams(params);
		const endpoint = `/territories/check-adjacent?${queryParams.toString()}`;
		const result = await makeZenbookerRequest(endpoint, "GET", undefined, apiKey);
		return formatToolResult(result);
	}
};

/**
 * All scheduling tools exported as an array
 */
export const schedulingTools = [
	checkTerritoryCoverageTool,
	getAvailableAppointmentsTool,
	checkAdjacentTerritoresTool,
] as const;