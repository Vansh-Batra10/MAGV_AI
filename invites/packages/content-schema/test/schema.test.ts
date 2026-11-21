import { describe, expect, it } from "vitest";
import { GuestVars, WeddingContent, buildUpiUri, invitedEvents, sampleGuests, sampleWedding, sanitizeUpiNote, stressPresets, buildIcs, coupleOrder } from "../src";

describe("content schema", () => {
  it("accepts the sample wedding and every stress preset", () => {
    expect(() => WeddingContent.parse(sampleWedding)).not.toThrow();
    for (const [name, p] of Object.entries(stressPresets)) {
      expect(() => WeddingContent.parse(p.content), name).not.toThrow();
      expect(() => GuestVars.parse(p.guest), name).not.toThrow();
    }
  });
  it("rejects a story with more than 4 beats and captions over 90 chars", () => {
    const five = Array.from({ length: 5 }, () => ({ caption: "x" }));
    expect(WeddingContent.safeParse({ ...sampleWedding, story: five }).success).toBe(false);
    expect(WeddingContent.safeParse({ ...sampleWedding, story: [{ caption: "y".repeat(91) }] }).success).toBe(false);
  });
  it("shows only invited functions, ordered by time", () => {
    const evs = invitedEvents(sampleWedding, { invitedEventIds: ["reception", "haldi"] });
    expect(evs.map((e) => e.id)).toEqual(["haldi", "reception"]);
  });
  it("orders the couple", () => {
    expect(coupleOrder(sampleWedding)[0].name).toBe("Ananya");
    expect(coupleOrder({ ...sampleWedding, order: "groom-first" })[0].name).toBe("Rohan");
  });
  it("guest note is capped at 140 chars", () => {
    expect(GuestVars.safeParse({ ...sampleGuests.friend, note: "a".repeat(141) }).success).toBe(false);
  });
});

describe("UPI intent", () => {
  it("builds a correct URI", () => {
    const uri = buildUpiUri({ vpa: "ananya.rohan@okdemo", payeeName: "Ananya Mehta", amount: 2100, note: "Shagun: Ek sunset dinner" });
    expect(uri).toBe("upi://pay?pa=ananya.rohan%40okdemo&pn=Ananya%20Mehta&am=2100.00&cu=INR&tn=Shagun%3A%20Ek%20sunset%20dinner");
  });
  it("omits amount for any-amount blocks", () => {
    expect(buildUpiUri({ vpa: "a.b@ok", payeeName: "A", amount: null })).toBe("upi://pay?pa=a.b%40ok&pn=A&cu=INR");
  });
  it("rejects bad VPAs and amounts", () => {
    expect(() => buildUpiUri({ vpa: "notavpa", payeeName: "A" })).toThrow();
    expect(() => buildUpiUri({ vpa: "a.b@ok", payeeName: "A", amount: -5 })).toThrow();
  });
  it("strips emoji and caps the note", () => {
    expect(sanitizeUpiNote("🎉 Shagun   for you ".repeat(10)).length).toBeLessThanOrEqual(50);
    expect(sanitizeUpiNote("Pehla ghar 🪴")).toBe("Pehla ghar");
  });
});

describe("ics", () => {
  it("builds a valid single event", () => {
    const ics = buildIcs(sampleWedding.events[0]!, "Haldi, Ananya & Rohan");
    expect(ics).toContain("DTSTART:20270212T043000Z");
    expect(ics).toContain("SUMMARY:Haldi\\, Ananya & Rohan");
  });
});
