import { describe, it, expect, beforeEach, vi } from "vitest";
import { TEST_API_KEY } from './setup';
import { 
	checkTerritoryCoverageTool, 
	getAvailableAppointmentsTool, 
	checkAdjacentTerritoresTool 
} from "../src/tools/scheduling.js";
import type { ApiResponse } from "../src/types.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("Scheduling Management Tools", () => {
	const mockApiKey = TEST_API_KEY;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("check_territory_coverage tool", () => {
		it("should have correct tool definition", () => {
			expect(checkTerritoryCoverageTool.name).toBe("check_territory_coverage");
			expect(checkTerritoryCoverageTool.description).toContain("serviced territories");
			expect(checkTerritoryCoverageTool.schema.address).toBeDefined();
		});

		it("should check if address is in serviced territory", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					covered: true,
					territory_id: "territory-123",
					territory_name: "Downtown Area",
					service_radius: 10,
					estimated_travel_time: 15
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await checkTerritoryCoverageTool.handler(
				{ address: "123 Main St, Anytown, CA 90210" },
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.zenbooker.com/v1/territories/check-coverage?address=123+Main+St%2C+Anytown%2C+CA+90210",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Authorization": `Bearer ${mockApiKey}`,
						"Content-Type": "application/json",
					}),
				})
			);

			expect(result.content[0].text).toContain("territory-123");
			expect(result.content[0].text).toContain("Downtown Area");
		});

		it("should handle address not in any territory", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					covered: false,
					nearest_territory: {
						territory_id: "territory-456",
						territory_name: "Suburban Area",
						distance_miles: 5.2
					}
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await checkTerritoryCoverageTool.handler(
				{ address: "999 Remote Lane, Faraway, CA 90211" },
				mockApiKey
			);

			expect(result.content[0].text).toContain("covered\": false");
			expect(result.content[0].text).toContain("territory-456");
		});
	});

	describe("get_available_appointments tool", () => {
		it("should have correct tool definition", () => {
			expect(getAvailableAppointmentsTool.name).toBe("get_available_appointments");
			expect(getAvailableAppointmentsTool.description).toContain("appointment times");
			expect(getAvailableAppointmentsTool.schema.address).toBeDefined();
			expect(getAvailableAppointmentsTool.schema.service_duration).toBeDefined();
		});

		it("should get next available appointment times for address", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					territory_id: "territory-123",
					available_slots: [
						{
							datetime: "2025-08-21T09:00:00Z",
							duration_minutes: 60,
							team_member_id: "tech-001",
							team_member_name: "John Smith"
						},
						{
							datetime: "2025-08-21T14:00:00Z",
							duration_minutes: 60,
							team_member_id: "tech-002",
							team_member_name: "Jane Doe"
						}
					],
					estimated_travel_time: 15
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await getAvailableAppointmentsTool.handler(
				{
					address: "123 Main St, Anytown, CA 90210",
					service_duration: 60
				},
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.zenbooker.com/v1/scheduling/available-appointments?address=123+Main+St%2C+Anytown%2C+CA+90210&service_duration=60&limit=10",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Authorization": `Bearer ${mockApiKey}`,
						"Content-Type": "application/json",
					}),
				})
			);

			expect(result.content[0].text).toContain("2025-08-21T09:00:00Z");
			expect(result.content[0].text).toContain("John Smith");
			expect(result.content[0].text).toContain("territory-123");
		});

		it("should respect custom limit parameter", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					territory_id: "territory-123",
					available_slots: []
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await getAvailableAppointmentsTool.handler(
				{
					address: "123 Main St",
					service_duration: 30,
					limit: 5
				},
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=5"),
				expect.any(Object)
			);
		});

		it("should default limit to 10", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: { territory_id: "territory-123", available_slots: [] }
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await getAvailableAppointmentsTool.handler(
				{
					address: "123 Main St",
					service_duration: 30
				},
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=10"),
				expect.any(Object)
			);
		});

		it("should include optional start_date filter", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: { territory_id: "territory-123", available_slots: [] }
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await getAvailableAppointmentsTool.handler(
				{
					address: "123 Main St",
					service_duration: 30,
					start_date: "2025-08-25"
				},
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("start_date=2025-08-25"),
				expect.any(Object)
			);
		});
	});

	describe("check_adjacent_territories tool", () => {
		it("should have correct tool definition", () => {
			expect(checkAdjacentTerritoresTool.name).toBe("check_adjacent_territories");
			expect(checkAdjacentTerritoresTool.description).toContain("nearby territories");
			expect(checkAdjacentTerritoresTool.schema.address).toBeDefined();
		});

		it("should find territories adjacent to address outside coverage", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					address_covered: false,
					adjacent_territories: [
						{
							territory_id: "territory-789",
							territory_name: "North District",
							distance_miles: 2.1,
							estimated_travel_time: 8,
							expansion_possible: true
						},
						{
							territory_id: "territory-456",
							territory_name: "East District", 
							distance_miles: 3.5,
							estimated_travel_time: 12,
							expansion_possible: false
						}
					],
					recommendation: "Consider expanding North District territory"
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await checkAdjacentTerritoresTool.handler(
				{ address: "555 Border St, Outskirts, CA 90212" },
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.zenbooker.com/v1/territories/check-adjacent?address=555+Border+St%2C+Outskirts%2C+CA+90212",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Authorization": `Bearer ${mockApiKey}`,
						"Content-Type": "application/json",
					}),
				})
			);

			expect(result.content[0].text).toContain("territory-789");
			expect(result.content[0].text).toContain("North District");
			expect(result.content[0].text).toContain("expansion_possible");
		});

		it("should handle address with no adjacent territories", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					address_covered: false,
					adjacent_territories: [],
					recommendation: "Address is too far from existing territories"
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await checkAdjacentTerritoresTool.handler(
				{ address: "999 Remote Mountain Rd" },
				mockApiKey
			);

			expect(result.content[0].text).toContain("adjacent_territories\": []");
			expect(result.content[0].text).toContain("too far from existing");
		});

		it("should include optional max_distance parameter", async () => {
			const mockResponse: ApiResponse = {
				success: true,
				data: {
					address_covered: false,
					adjacent_territories: []
				}
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await checkAdjacentTerritoresTool.handler(
				{
					address: "123 Test St",
					max_distance: 5
				},
				mockApiKey
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("max_distance=5"),
				expect.any(Object)
			);
		});
	});
});