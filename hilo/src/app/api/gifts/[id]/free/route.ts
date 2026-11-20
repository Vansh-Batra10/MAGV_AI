import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { getEditableGift, publishGift, giftUrl } from "@/lib/server/gifts";
import { q, one } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { FREE_TIER } from "@/config/pricing";
import { getSession } from "@/lib/server/auth";
import { track } from "@/lib/server/events";
import { send } from "@/lib/server/adapters/messaging";
import { recordConsent } from "@/lib/server/consent";

const B = z.object({ email: z.string().email().max(120), consent: z.literal(true) });

/** Free 24-hour Quick Surprise. Soft quota: 3 per email / IP / device per 30 days. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("free.send", 10, 3600))) return err("rate_limited", 429);
  const g = await getEditableGift((await params).id);
  if (!g) return err("not_found", 404);
  if (g.tier !== "free") return err("not_free_template", 400);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const v = await visitor();
  const s = await getSession();
  const email = (s?.email ?? b.data.email).toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const keys = [`e:${email}`, `ip:${ip}`, ...(v.anonId ? [`d:${v.anonId}`] : [])];
  for (const k of keys) {
    const r = await one<{ n: number }>(`select count(*)::int as n from free_quota where key=$1 and created_at > now() - interval '30 days'`, [k]);
    if ((r?.n ?? 0) >= FREE_TIER.maxPerContactPer30Days && !k.startsWith("ip:local")) return err("free_quota_reached", 429);
  }
  const slug = g.slug ?? (await publishGift(g.id, { tier: "free", duration: "h24", hours: FREE_TIER.hours }));
  if (!g.slug) for (const k of keys) await q(`insert into free_quota (id, key) values ($1,$2)`, [newId(), k]);
  await q(`update gifts set sender_contact = coalesce(sender_contact, '{}'::jsonb) || $2 where id=$1`, [g.id, { email }]);
  await recordConsent("buyer", email, "free_gift_delivery", true);
  await track("free_gift_sent", { anonId: v.anonId, giftId: g.id });
  const url = giftUrl(slug);
  await send({ channel: "email", to: email, template: "free_gift_ready", category: "utility", subject: "Your free gift is live for 24 hours 💌", text: `Your gift is live for 24 hours: ${url}\nWant it to last forever? Upgrade any time from your success page.` });
  return json({ slug, giftId: g.id });
}
