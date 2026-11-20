import { describe, it, expect } from "vitest";
import { CITIES, distanceKm, findCity, searchCities } from "@/data/cities";

describe("cities", () => {
  it("bundles 200+ cities with valid IANA zones", () => {
    expect(CITIES.length).toBeGreaterThan(200);
    for (const c of CITIES) expect(() => new Intl.DateTimeFormat("en", { timeZone: c.tz })).not.toThrow();
  });
  it("computes great-circle distance", () => {
    const d = distanceKm(findCity("Mumbai")!, findCity("Toronto")!);
    expect(d).toBeGreaterThan(12000);
    expect(d).toBeLessThan(12700);
  });
  it("searches by prefix first", () => {
    expect(searchCities("tor")[0].name).toBe("Toronto");
  });
});
