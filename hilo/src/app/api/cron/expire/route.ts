import { q } from "@/lib/server/db";
import { cronAuthorized, cronNow } from "@/lib/server/cron";
import { notifyExpiring } from "@/lib/server/notify";
import { storage } from "@/lib/server/adapters/storage";
import type { GiftRow } from "@/lib/server/gifts";
import { now } from "@/lib/server/env";

/**
 * Hourly: (1) one "expires soon" reminder for 24h gifts, (2) retention schedule:
 * free gifts purged 7 days after expiry; drafts purged after 30 days of inactivity.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("unauthorized", { status: 401 });
  const t = cronNow(req, now());
  const soon = await q<GiftRow>(`select * from gifts where duration='h24' and expires_at_utc between $1 and $1::timestamptz + interval '6 hours' and expiry_reminder_sent=false limit 200`, [t]);
  for (const g of soon) {
    await q(`update gifts set expiry_reminder_sent=true where id=$1`, [g.id]);
    await notifyExpiring(g);
  }
  const purge = await q<{ id: string; content: any }>(
    `select id, content from gifts where (tier='free' and duration='h24' and expires_at_utc < $1::timestamptz - interval '7 days') or (status='draft' and updated_at < $1::timestamptz - interval '30 days') limit 500`, [t]);
  for (const g of purge) {
    const keys = JSON.stringify(g.content ?? {}).match(/\/api\/media\/([a-z]+\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4})/g) ?? [];
    for (const k of keys) await storage.remove(k.replace("/api/media/", ""));
    const reactions = await q<{ storage_key: string }>(`select storage_key from reactions where gift_id=$1`, [g.id]);
    for (const r of reactions) await storage.remove(r.storage_key);
    await q(`delete from gifts where id=$1`, [g.id]);
  }
  return Response.json({ reminded: soon.length, purged: purge.length });
}
