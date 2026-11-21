import type { PRNG } from "./prng";

/**
 * Closed-form particles: the state at time τ is computed directly (no integration), so any frame can
 * be rendered from any seek position and is identical every time.
 */
export interface Particle {
  x0: number; y0: number; vx: number; vy: number; rot0: number; spin: number;
  size: number; flutterAmp: number; flutterFreq: number; phase: number; hue: number; life: number; delay: number;
}

export interface BurstOptions {
  count: number;
  x: number; y: number;
  /** Spread of initial speed (px/s). */
  speed: [number, number];
  /** Emission angle range in radians (0 = right, -π/2 = up). */
  angle: [number, number];
  size: [number, number];
  life: [number, number];
  spin?: [number, number];
  flutter?: [number, number];
  delay?: [number, number];
  originJitter?: [number, number];
}

export function makeBurst(rng: PRNG, o: BurstOptions): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < o.count; i++) {
    const a = rng.range(o.angle[0], o.angle[1]);
    const s = rng.range(o.speed[0], o.speed[1]);
    const j = o.originJitter ?? [0, 0];
    ps.push({
      x0: o.x + rng.range(-j[0], j[0]), y0: o.y + rng.range(-j[1], j[1]),
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      rot0: rng.range(0, Math.PI * 2), spin: rng.range(...(o.spin ?? [-4, 4])),
      size: rng.range(o.size[0], o.size[1]),
      flutterAmp: rng.range(...(o.flutter ?? [0, 0])), flutterFreq: rng.range(1.5, 3.5), phase: rng.range(0, Math.PI * 2),
      hue: rng(), life: rng.range(o.life[0], o.life[1]), delay: rng.range(...(o.delay ?? [0, 0])),
    });
  }
  return ps;
}

export interface ParticleState { x: number; y: number; rot: number; alpha: number; alive: boolean }

/** Position at time τ (s) with linear drag k and gravity g (px/s², +y is down). */
export function particleAt(p: Particle, tau: number, g = 520, k = 1.6): ParticleState {
  const t = tau - p.delay;
  if (t < 0 || t > p.life) return { x: p.x0, y: p.y0, rot: p.rot0, alpha: 0, alive: false };
  const e = (1 - Math.exp(-k * t)) / k;
  const x = p.x0 + p.vx * e + p.flutterAmp * Math.sin(p.flutterFreq * t * Math.PI * 2 + p.phase) * Math.min(1, t * 2);
  const y = p.y0 + (g * t) / k + (p.vy - g / k) * e;
  const fadeIn = Math.min(1, t / 0.08);
  const fadeOut = Math.min(1, (p.life - t) / 0.5);
  return { x, y, rot: p.rot0 + p.spin * t, alpha: Math.max(0, Math.min(fadeIn, fadeOut)), alive: true };
}

/** Pre-render a sprite to an offscreen canvas (petals, confetti) so per-frame drawing is a drawImage. */
export function spriteCanvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  return c;
}
