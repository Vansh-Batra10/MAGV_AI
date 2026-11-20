import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ENV } from "./env";
import { getGiftBySlug, isLive, type GiftRow } from "./gifts";

/** Password-gate cookie per gift slug (HMAC of slug + password hash, so changing the password revokes it). */
export function gateValue(g: GiftRow) {
  return crypto.createHmac("sha256", ENV.authSecret).update(`${g.slug}|${g.password_hash}`).digest("base64url").slice(0, 32);
}
export const gateCookie = (slug: string) => `hilo_gp_${slug}`;

export async function passedGate(g: GiftRow) {
  if (!g.password_hash) return true;
  return (await cookies()).get(gateCookie(g.slug!))?.value === gateValue(g);
}

/** A gift the recipient can interact with right now (live + past password gate). */
export async function liveGiftForRecipient(slug: string): Promise<GiftRow | null> {
  const g = await getGiftBySlug(slug);
  if (!g || isLive(g) !== "live") return null;
  if (!(await passedGate(g))) return null;
  return g;
}
