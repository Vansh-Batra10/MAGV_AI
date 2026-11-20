import { describe, it, expect } from "vitest";
import { nthWeekday, easterSunday, dateForYear, activeTakeover, occasionBySlug, nextOccurrence, daysUntil } from "@/config/occasions";

const d = (s: string) => new Date(s + "T00:00:00Z");
const iso = (x: Date | null) => x?.toISOString().slice(0, 10);

describe("occasion date maths", () => {
  it("computes nth weekdays", () => {
    expect(iso(nthWeekday(2026, 11, 4, 4))).toBe("2026-11-26"); // Thanksgiving 2026
    expect(iso(nthWeekday(2027, 5, 0, 2))).toBe("2027-05-09"); // Mother's Day US 2027
    expect(iso(nthWeekday(2027, 6, 0, 3))).toBe("2027-06-20"); // Father's Day 2027
  });
  it("computes Easter and UK Mothering Sunday", () => {
    expect(iso(easterSunday(2027))).toBe("2027-03-28");
    expect(iso(dateForYear(occasionBySlug("mothers-day")!.dateRule, 2027, "GB"))).toBe("2027-03-07");
    expect(iso(dateForYear(occasionBySlug("mothers-day")!.dateRule, 2027, "IN"))).toBe("2027-05-09");
  });
  it("finds the next Christmas and its countdown", () => {
    const today = d("2026-11-20");
    const xmas = nextOccurrence(occasionBySlug("christmas")!, today)!;
    expect(iso(xmas)).toBe("2026-12-25");
    expect(daysUntil(xmas, today)).toBe(35);
  });
  it("prefers the Christmas takeover over Thanksgiving by priority", () => {
    expect(activeTakeover("GLOBAL", d("2026-11-20"))?.occasion.slug).toBe("christmas");
  });
  it("honours ?season= overrides", () => {
    expect(activeTakeover("IN", d("2026-06-01"), null, "diwali")?.occasion.slug).toBe("diwali");
  });
  it("switches to New Year after Christmas", () => {
    expect(activeTakeover("IN", d("2026-12-27"))?.occasion.slug).toBe("new-year");
  });
});
