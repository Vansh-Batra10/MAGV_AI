import { cronAuthorized } from "@/lib/server/cron";

/**
 * Unlock Calendar notifications (Valentine Week, Advent). Unlocks themselves are enforced on read, server-side,
 * so this job only sends optional "Day N unlocked" pings. Ships with the Unlock Calendar engine in Release 2.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("unauthorized", { status: 401 });
  return Response.json({ notified: 0, note: "unlock calendar templates ship in release 2" });
}
