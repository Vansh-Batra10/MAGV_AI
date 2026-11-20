import "server-only";
import { cookies } from "next/headers";
import { track, type EventName } from "./events";
import { log } from "./log";

/** Server-side event from a page render (never blocks the page). */
export async function trackServer(name: EventName, props: Record<string, unknown> = {}) {
  try {
    const c = await cookies();
    await track(name, { anonId: c.get("hilo_anon")?.value ?? null, props });
  } catch (err) {
    log.warn("track.failed", { name, error: String(err) });
  }
}
