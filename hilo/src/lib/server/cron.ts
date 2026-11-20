import "server-only";
import { ENV, MOCK } from "./env";

/** Vercel cron sends `Authorization: Bearer $CRON_SECRET`. In MOCK mode without a secret, allow local calls. */
export function cronAuthorized(req: Request) {
  if (!ENV.cronSecret) return MOCK.db || process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${ENV.cronSecret}`;
}

/** Fake clock for e2e tests: `?now=ISO` is honoured only in MOCK db mode outside production. */
export function cronNow(req: Request, fallback: Date): Date {
  const v = new URL(req.url).searchParams.get("now");
  if (v && MOCK.db && (process.env.NODE_ENV !== "production" || process.env.HILO_OPEN_TOOLS === "1")) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}
