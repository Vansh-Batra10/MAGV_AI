import { q } from "@/lib/server/db";
import { cronAuthorized } from "@/lib/server/cron";
import { deliverToRecipient } from "@/lib/server/notify";
import { send, pickChannel } from "@/lib/server/adapters/messaging";
import { giftUrl, type GiftRow } from "@/lib/server/gifts";
import { now } from "@/lib/server/env";
import { log } from "@/lib/server/log";

/** Every 5 minutes: deliver scheduled gifts and reveal group gifts whose time has come. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("unauthorized", { status: 401 });
  const t = now();
  const due = await q<GiftRow>(`select * from gifts where status in ('scheduled','paid') and deliver_at_utc is not null and deliver_at_utc <= $1 and delivered_at is null and takedown_status='none' limit 200`, [t]);
  let delivered = 0;
  for (const g of due) {
    const claimed = await q(`update gifts set status='delivered', delivered_at=$2 where id=$1 and delivered_at is null returning id`, [g.id, t]);
    if (!claimed.length) continue;
    try {
      await deliverToRecipient(g);
      if (g.mode === "group") {
        const people = await q<{ contact: any }>(`select contact from group_contributions where gift_id=$1 and contact is not null`, [g.id]);
        for (const p of people) {
          const ch = pickChannel({ email: p.contact?.email, phone: p.contact?.phone }, g.market, "utility");
          if (ch) await send({ ...ch, template: "group_revealed", category: "utility", subject: `The surprise for ${g.recipient_name} is out 🎉`, text: `The group surprise for ${g.recipient_name} was just revealed: ${giftUrl(g.slug!)}` });
        }
      }
      delivered++;
    } catch (e) {
      log.error("cron.deliver_failed", { gift: g.id, error: String(e) });
    }
  }
  return Response.json({ delivered, at: t.toISOString() });
}
