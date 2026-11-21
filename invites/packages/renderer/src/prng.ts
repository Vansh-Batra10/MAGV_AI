/** Seeded PRNG (mulberry32). Never use Math.random() in rendering: frames must be reproducible. */
export interface PRNG {
  (): number;
  range(min: number, max: number): number;
  int(min: number, maxExclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  fork(salt: string): PRNG;
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createPRNG(seed: string | number): PRNG {
  let a = typeof seed === "number" ? seed >>> 0 : hashString(seed);
  const next = (() => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as PRNG;
  next.range = (min, max) => min + (max - min) * next();
  next.int = (min, max) => Math.floor(next.range(min, max));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)]!;
  next.fork = (salt) => createPRNG(`${typeof seed === "number" ? seed : seed}:${salt}`);
  return next;
}
