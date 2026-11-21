import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

process.env.ASSET_DIR = mkdtempSync(join(tmpdir(), "assets-"));
const { generateSlot, readManifest, review, lintPrompt, decodePng, MockProvider, purgeablePersonal } = await import("../src");

describe("AI asset pipeline (MOCK provider)", () => {
  it("runs end to end for one pack slot per template", async () => {
    for (const [template, pack, slot] of [["sheesh-mahal", "jaipur-dusk", "door-left"], ["rang-kahani", "bombay-monsoon", "city-skyline"], ["mohar", "plum-olive", "venue-paint"]] as const) {
      const r = await generateSlot({ template, pack, slot, consent: true });
      expect(r.review).toBe("pending");
      expect(r.variants.some((v) => v.format === "avif")).toBe(true);
      expect(r.variants.some((v) => v.format === "webp")).toBe(true);
      expect(r.checks.find((c) => c.name === "size")?.ok).toBe(true);
    }
    expect(readManifest()).toHaveLength(3);
  }, 120_000);
  it("cut-outs keep transparency after the matte choke", async () => {
    const r = await generateSlot({ template: "sheesh-mahal", pack: "jaipur-dusk", slot: "door-left" });
    expect(r.checks.find((c) => c.name === "alpha")?.ok).toBe(true);
  }, 60_000);
  it("personal assets need consent", async () => {
    await expect(generateSlot({ template: "rang-kahani", pack: "bombay-monsoon", slot: "puppet-bride-haldi" })).rejects.toThrow(/consent/);
  });
  it("approval moves the asset out of the queue", async () => {
    const id = readManifest()[0]!.id;
    expect(review(id, "approved").review).toBe("approved");
  });
  it("prompt lint catches missing constraints and real names", () => {
    expect(lintPrompt("A palace. no text, no logos")).toEqual([]);
    expect(lintPrompt("A portrait of Deepika")).toContain("names a real person");
  });
  it("mock art is deterministic and decodable", async () => {
    const m = new MockProvider();
    const a = await m.generate({ prompt: "x", size: { w: 64, h: 96 } }), b = await m.generate({ prompt: "x", size: { w: 64, h: 96 } });
    expect(a.png.equals(b.png)).toBe(true);
    expect(decodePng(a.png).w).toBe(64);
  });
  it("finds personal photos due for deletion", () => {
    const recs = [{ scope: "wedding", ownerId: "w1" }, { scope: "wedding", ownerId: "w2" }] as never[];
    const due = purgeablePersonal(recs, { w1: "2026-01-01T00:00:00Z", w2: new Date().toISOString() });
    expect(due).toHaveLength(1);
  });
});
