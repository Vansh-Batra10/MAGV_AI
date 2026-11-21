import type { Tier } from "./types";

export interface TierSignals {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  effectiveType?: string;
  saveData?: boolean;
  /** Average frame time (ms) measured by a short rAF probe. */
  probeFrameMs?: number;
  prefersReducedMotion?: boolean;
}

export interface TierResult { tier: Tier; lite: boolean; reduced: boolean; reasons: string[] }

/** Pure decision function (unit tested). */
export function decideTier(s: TierSignals): TierResult {
  const reasons: string[] = [];
  let score = 2; // 2 = A, 1 = B, 0 = C
  const lite = !!s.saveData || s.effectiveType === "2g" || s.effectiveType === "slow-2g";
  if (lite) reasons.push(s.saveData ? "save-data" : `network ${s.effectiveType}`);
  if (s.deviceMemory !== undefined) {
    if (s.deviceMemory <= 2) { score = Math.min(score, 0); reasons.push(`memory ${s.deviceMemory}GB`); }
    else if (s.deviceMemory <= 4) { score = Math.min(score, 1); reasons.push(`memory ${s.deviceMemory}GB`); }
  }
  if (s.hardwareConcurrency !== undefined) {
    if (s.hardwareConcurrency <= 2) { score = Math.min(score, 0); reasons.push(`${s.hardwareConcurrency} cores`); }
    else if (s.hardwareConcurrency <= 4) { score = Math.min(score, 1); reasons.push(`${s.hardwareConcurrency} cores`); }
  }
  if (s.effectiveType === "3g") { score = Math.min(score, 1); reasons.push("3g"); }
  if (s.probeFrameMs !== undefined) {
    if (s.probeFrameMs > 33) { score = Math.min(score, 0); reasons.push(`probe ${s.probeFrameMs.toFixed(1)}ms`); }
    else if (s.probeFrameMs > 20) { score = Math.min(score, 1); reasons.push(`probe ${s.probeFrameMs.toFixed(1)}ms`); }
  }
  const tier: Tier = score === 2 ? "A" : score === 1 ? "B" : "C";
  return { tier, lite, reduced: !!s.prefersReducedMotion, reasons };
}

export const tierConfig: Record<Tier, { dprCap: number; particleScale: number; blur: boolean; canvas: boolean }> = {
  A: { dprCap: 2, particleScale: 1, blur: true, canvas: true },
  B: { dprCap: 1.75, particleScale: 0.55, blur: false, canvas: true },
  C: { dprCap: 1.25, particleScale: 0, blur: false, canvas: false },
};

export function readSignals(): TierSignals {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; saveData?: boolean } };
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    effectiveType: nav.connection?.effectiveType,
    saveData: nav.connection?.saveData,
    prefersReducedMotion: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

/** 500 ms requestAnimationFrame probe: average frame time in ms. */
export function probeFrames(ms = 500): Promise<number> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") return resolve(16.7);
    const start = performance.now();
    let frames = 0;
    const step = (now: number) => {
      frames++;
      if (now - start >= ms) resolve((now - start) / Math.max(1, frames));
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

export async function detectTier(probeMs = 500): Promise<TierResult> {
  const s = readSignals();
  s.probeFrameMs = await probeFrames(probeMs);
  return decideTier(s);
}

/**
 * Live downgrade: if measured FPS stays below `minFps` for `windowMs`, call `onDowngrade` (A→B, B→C).
 * Never upgrades mid-session.
 */
export class FpsMonitor {
  private last = 0;
  private lowSince = -1;
  private raf = 0;
  private frames: number[] = [];
  fps = 60;
  constructor(private tier: Tier, private onDowngrade: (t: Tier) => void, private minFps = 40, private windowMs = 2000) {}
  start(): void {
    const loop = (now: number) => {
      if (this.last) {
        this.frames.push(now - this.last);
        if (this.frames.length > 30) this.frames.shift();
        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        this.fps = 1000 / avg;
        if (this.fps < this.minFps && this.frames.length >= 20) {
          if (this.lowSince < 0) this.lowSince = now;
          else if (now - this.lowSince > this.windowMs && this.tier !== "C") {
            this.tier = this.tier === "A" ? "B" : "C";
            this.lowSince = -1;
            this.frames = [];
            this.onDowngrade(this.tier);
          }
        } else this.lowSince = -1;
      }
      this.last = now;
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(): void { cancelAnimationFrame(this.raf); }
}
