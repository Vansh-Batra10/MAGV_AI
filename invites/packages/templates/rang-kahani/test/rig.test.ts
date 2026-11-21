import { describe, expect, it } from "vitest";
import { RIG, actionPose, type Action } from "../src/puppets";

describe("puppet rig", () => {
  it("every child joint pivots exactly at the end of its parent limb (no gaps)", () => {
    for (const [name, j] of Object.entries(RIG)) {
      if (!j.parent || !RIG[j.parent].length) continue;
      const parent = RIG[j.parent];
      // limbs hang straight down in the rest pose
      expect(j.pivot[0], name).toBe(parent.pivot[0]);
      expect(j.pivot[1], name).toBeCloseTo(parent.pivot[1] + parent.length!, 5);
      // capsule ends overlap the joint: both radii cover the pivot
      expect(j.radius + parent.radius, name).toBeGreaterThan(8);
    }
  });
  it("all action poses stay within joint limits at every sampled time", () => {
    const actions: Action[] = ["idle", "wave", "laugh", "showHands", "dance", "varmala", "sway", "jump", "shrug", "sad", "ride"];
    for (const a of actions) for (let t = 0; t < 4; t += 0.25) {
      const p = actionPose(a, t, 1.3, 1);
      for (const k of ["armL", "foreL", "armR", "foreR", "head", "body", "hip"] as const) {
        const v = p[k];
        if (v === undefined) continue;
        expect(v, `${a}.${k}@${t}`).toBeGreaterThanOrEqual(RIG[k].min - 1e-9);
        expect(v, `${a}.${k}@${t}`).toBeLessThanOrEqual(RIG[k].max + 1e-9);
      }
    }
  });
});
