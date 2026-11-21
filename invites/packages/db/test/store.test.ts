import { describe, expect, it } from "vitest";
import { AccessDenied, Store, base62 } from "../src";
import { sampleWedding } from "@invites/content-schema";

describe("mock store", () => {
  it("guest codes are unguessable base62", () => {
    const a = new Set(Array.from({ length: 2000 }, () => base62(10)));
    expect(a.size).toBe(2000);
    for (const c of a) expect(c).toMatch(/^[0-9A-Za-z]{10}$/);
  });
  it("isolates weddings between couples (RLS parity)", () => {
    const s = new Store(null);
    s.raw().users.push({ id: "u2", phone: "+91999", role: "couple", createdAt: "" });
    const mine = s.createWedding("u2", { templateId: "mohar", packId: "plum-olive", content: sampleWedding });
    expect(s.weddingsFor("u2").map((w) => w.id)).toEqual([mine.id]);
    expect(() => s.wedding("u2", "w-demo")).toThrow(AccessDenied);
    expect(() => s.guestsOf("u2", "w-demo")).toThrow(AccessDenied);
    expect(() => s.updateGuest("u2", "w-demo", "w-demo-elder", { salutation: "x" })).toThrow(AccessDenied);
    expect(() => s.wedding("user-demo", mine.id)).toThrow(AccessDenied);
  });
  it("guest scope only sees its own wedding", () => {
    const s = new Store(null);
    expect(s.guestBundle("demo", "riyaFRND2")?.guest.salutation).toBe("Riya");
    expect(s.guestBundle("demo", "riyaFRND2-rk")).toBeNull();
    expect(s.guestBundle("demo-rk", "riyaFRND2")).toBeNull();
  });
  it("rsvp is clamped to invited events and household size", () => {
    const s = new Store(null);
    const { guest } = s.guestBundle("demo", "kapoorOF3")!;
    s.saveRsvp(guest, { entries: [{ eventId: "wedding", status: "yes", adults: 9, kids: 0 }, { eventId: "haldi", status: "yes", adults: 1, kids: 0 }], pickupNeeded: false, stayNeeded: false });
    const r = s.rsvpFor(guest.id)!;
    expect(r.entries.map((e) => e.eventId)).toEqual(["wedding"]);
    expect(r.entries[0]!.adults).toBe(2);
    expect(s.confirmedHouseholds(guest.weddingId)).toBe(1);
  });
  it("pledges require shagun visibility", () => {
    const s = new Store(null);
    const elder = s.guestBundle("demo", "mehtaPAR1")!.guest;
    const friend = s.guestBundle("demo", "riyaFRND2")!.guest;
    expect(() => s.pledge(elder, "b1", 2100)).toThrow(AccessDenied);
    s.pledge(friend, "b1", 2100);
    expect(s.pledgesOf("user-demo", "w-demo")).toHaveLength(1);
  });
  it("signature markup is sanitised", () => {
    const s = new Store(null);
    const g = s.guestBundle("demo", "riyaFRND2")!.guest;
    s.sign(g, "Bless", '<svg onload="x"><script/></svg>');
    expect(s.extrasOf("user-demo", "w-demo").blessings[0]!.signatureSvg).toBeUndefined();
  });
});
