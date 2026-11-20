import "server-only";
import { ENV } from "./env";

const buckets = new Map<string, { n: number; reset: number }>();

/** Fixed-window limiter. In-memory in dev; Upstash REST when configured. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  if (ENV.upstashUrl && ENV.upstashToken) {
    try {
      const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
      const res = await fetch(`${ENV.upstashUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ENV.upstashToken}` },
        body: JSON.stringify([["INCR", k], ["EXPIRE", k, String(windowSec)]]),
      });
      const data = (await res.json()) as { result: number }[];
      return data[0].result <= limit;
    } catch {
      /* fall through to memory */
    }
  }
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  b.n++;
  return b.n <= limit;
}

export function clientIp(h: Headers): string {
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}
