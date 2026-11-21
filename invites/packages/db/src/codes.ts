import { randomBytes } from "node:crypto";

const ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** Unguessable base62 code (rejection sampling, no modulo bias). */
export function base62(len = 10): string {
  let out = "";
  while (out.length < len) {
    for (const b of randomBytes(len * 2)) { if (b < 248 && out.length < len) out += ALPHA[b % 62]; }
  }
  return out;
}
export const newId = () => base62(16);
