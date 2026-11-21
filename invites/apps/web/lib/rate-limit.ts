const buckets = new Map<string, { tokens: number; at: number }>();
/** Token bucket: `perMin` requests per minute per key. In production use the edge/WAF limiter as well. */
export function allow(key: string, perMin = 30): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: perMin, at: now };
  b.tokens = Math.min(perMin, b.tokens + ((now - b.at) / 60000) * perMin);
  b.at = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 50000) buckets.clear();
  return true;
}
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
