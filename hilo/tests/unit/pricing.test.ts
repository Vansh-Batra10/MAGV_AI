import { describe, it, expect } from "vitest";
import { priceFor, upgradePrice, formatMoney, durationsFor } from "@/config/pricing";

describe("pricing", () => {
  it("returns configured prices", () => {
    expect(priceFor("INR", "classic", "forever")).toBe(19900);
    expect(priceFor("USD", "mini", "h24")).toBe(199);
    expect(priceFor("INR", "premium", "h24")).toBeNull();
  });
  it("upgrade = forever − 24h", () => {
    expect(upgradePrice("INR", "classic")).toBe(10000);
    expect(upgradePrice("USD", "mini")).toBe(200);
  });
  it("formats Indian grouping and USD cents", () => {
    expect(formatMoney(10000000, "INR")).toBe("₹1,00,000");
    expect(formatMoney(699, "USD")).toBe("$6.99");
  });
  it("lists durations per tier", () => {
    expect(durationsFor("classic")).toEqual(["h24", "forever"]);
    expect(durationsFor("group")).toEqual(["forever"]);
  });
});
