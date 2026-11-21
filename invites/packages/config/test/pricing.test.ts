import { describe, expect, it } from "vitest";
import { canAddGuestLink, entitlementsFor, formatINR, isRefundable, tiers } from "../src/pricing";
import { isMockMode } from "../src/env";

describe("pricing", () => {
  it("formats Indian digit grouping", () => {
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(2100)).toBe("₹2,100");
    expect(formatINR(1100000, false)).toBe("11,00,000");
  });
  it("gates guest links by tier", () => {
    expect(canAddGuestLink("preview", 0)).toBe(false);
    expect(canAddGuestLink("classic", 249)).toBe(true);
    expect(canAddGuestLink("classic", 250)).toBe(false);
    expect(canAddGuestLink("signature", 10_000)).toBe(true);
  });
  it("only signature and above get shagun", () => {
    expect(entitlementsFor("classic").shagun).toBe(false);
    expect(entitlementsFor("signature").shagun).toBe(true);
    expect(entitlementsFor("couture").removeBrandFooter).toBe(true);
    expect(tiers.couture.inr).toBeGreaterThan(tiers.signature.inr);
  });
  it("refundable only before first send", () => {
    expect(isRefundable(null)).toBe(true);
    expect(isRefundable(new Date())).toBe(false);
  });
  it("mock mode defaults on", () => {
    expect(isMockMode({})).toBe(true);
    expect(isMockMode({ MOCK_MODE: "false" })).toBe(false);
  });
});
