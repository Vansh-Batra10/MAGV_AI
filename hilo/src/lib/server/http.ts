import "server-only";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import type { z } from "zod";
import { clientIp, rateLimit } from "./ratelimit";
import { isSiteKey, SITES, type Currency, type Market } from "@/config/markets";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function err(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function body<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, res: err("invalid_json") };
  }
  const r = schema.safeParse(raw);
  if (!r.success) return { ok: false, res: err("invalid_input", 400, { issues: r.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  return { ok: true, data: r.data };
}

/** Same-origin check for state-changing JSON endpoints (CSRF defence in depth; cookies are SameSite=Lax). */
export async function sameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser / same-origin fetch without Origin
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function limit(key: string, n: number, windowSec: number) {
  const h = await headers();
  return rateLimit(`${key}:${clientIp(h)}`, n, windowSec);
}

export async function visitor() {
  const c = await cookies();
  const site = c.get("hilo_site")?.value;
  const market: Market = site && isSiteKey(site) ? SITES[site].market : "GLOBAL";
  const country = c.get("hilo_country")?.value ?? null;
  const cur = c.get("hilo_currency")?.value as Currency | undefined;
  const currency: Currency = cur === "INR" || cur === "USD" ? cur : country === "IN" || market === "IN" ? "INR" : "USD";
  let utm: Record<string, string> | null = null;
  try {
    utm = JSON.parse(c.get("hilo_utm")?.value ?? "null");
  } catch {}
  return { market, country, currency, anonId: c.get("hilo_anon")?.value ?? null, bucket: c.get("hilo_ab")?.value ?? null, utm, lang: c.get("hilo_lang")?.value ?? null };
}
