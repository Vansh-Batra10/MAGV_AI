import { describe, expect, it } from "vitest";
import { createPRNG } from "../src/prng";
import { makeBurst, particleAt } from "../src/particles";
import { decideTier } from "../src/tier";

describe("determinism", () => {
  it("PRNG is reproducible per seed", () => {
    const a = createPRNG("invite-1"), b = createPRNG("invite-1"), c = createPRNG("invite-2");
    const sa = Array.from({ length: 5 }, () => a()), sb = Array.from({ length: 5 }, () => b()), sc = Array.from({ length: 5 }, () => c());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });
  it("particles are a pure function of time", () => {
    const ps = makeBurst(createPRNG("x"), { count: 20, x: 180, y: 400, speed: [200, 500], angle: [-Math.PI, 0], size: [6, 12], life: [2, 3], flutter: [5, 15] });
    const ps2 = makeBurst(createPRNG("x"), { count: 20, x: 180, y: 400, speed: [200, 500], angle: [-Math.PI, 0], size: [6, 12], life: [2, 3], flutter: [5, 15] });
    for (const t of [0, 0.3, 1.1, 2.5]) expect(ps.map((p) => particleAt(p, t))).toEqual(ps2.map((p) => particleAt(p, t)));
    // seeking backwards gives the same value as seeking forwards
    const fwd = particleAt(ps[3]!, 1.2); particleAt(ps[3]!, 2.0); expect(particleAt(ps[3]!, 1.2)).toEqual(fwd);
  });
});

describe("tier decision", () => {
  it("high-end device is A", () => expect(decideTier({ deviceMemory: 8, hardwareConcurrency: 8, effectiveType: "4g", probeFrameMs: 16 }).tier).toBe("A"));
  it("budget Android is B", () => expect(decideTier({ deviceMemory: 4, hardwareConcurrency: 8, effectiveType: "4g", probeFrameMs: 17 }).tier).toBe("B"));
  it("slow probe is C", () => expect(decideTier({ deviceMemory: 8, probeFrameMs: 40 }).tier).toBe("C"));
  it("save-data forces lite", () => expect(decideTier({ saveData: true }).lite).toBe(true));
  it("2g forces lite", () => expect(decideTier({ effectiveType: "2g" }).lite).toBe(true));
});
