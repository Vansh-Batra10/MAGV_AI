import { z } from "zod";
import { body, err, json, limit, visitor } from "@/lib/server/http";
import { q } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { liveGiftForRecipient } from "@/lib/server/giftAccess";
import { notifyOpened } from "@/lib/server/notify";
import { track } from "@/lib/server/events";

const B = z.object({ slug: z.string().max(30), device: z.enum(["mobile", "tablet", "desktop"]).default("mobile") });

/** Records an open (timestamp + coarse device only; no IP stored). Notifies the sender on the first open. */
export async function POST(req: Request) {
  if (!(await limit("open", 60, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const g = await liveGiftForRecipient(b.data.slug);
  if (!g) return err("not_found", 404);
  await q(`insert into opens (id, gift_id, device_kind) values ($1,$2,$3)`, [newId(), g.id, b.data.device]);
  const first = await q(`update gifts set first_opened_at=now() where id=$1 and first_opened_at is null returning id`, [g.id]);
  if (first.length) await notifyOpened(g);
  const v = await visitor();
  await track("gift_opened", { anonId: v.anonId, giftId: g.id, props: { first: !!first.length, template: g.template_slug } });
  return json({ ok: true });
}
