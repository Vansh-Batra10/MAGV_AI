import "server-only";
import { ENV, MOCK } from "./env";

/** Vercel cron sends `Authorization: Bearer $CRON_SECRET`. In MOCK mode without a secret, allow local calls. */
export function cronAuthorized(req: Request) {
  if (!ENV.cronSecret) return MOCK.db || process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${ENV.cronSecret}`;
}
