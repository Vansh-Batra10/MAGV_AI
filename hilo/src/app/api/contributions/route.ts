import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { one, q } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { clean, moderate } from "@/lib/server/moderation";
import { recordConsent } from "@/lib/server/consent";
import { track } from "@/lib/server/events";
import { now } from "@/lib/server/env";

const mediaUrl = z.string().regex(/^\/api\/media\/(photo|voice)\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4}$/).optional().nullable();
const B = z.object({
  token: z.string().max(40),
  name: z.string().trim().min(1).max(40),
  message: z.string().max(500),
  photoUrl: mediaUrl,
  voiceUrl: mediaUrl,
  contact: z.object({ email: z.string().email().max(120).optional().or(z.literal("")), phone: z.string().max(20).optional() }).optional(),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("contrib", 20, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const d = b.data;
  const t = await one<{ id: string; gift_id: string; deadline_utc: string | null; max_contributions: number }>(`select * from contrib_tokens where token=$1`, [d.token]);
  if (!t) return err("not_found", 404);
  if (t.deadline_utc && new Date(t.deadline_utc) < now()) return err("deadline_passed", 410);
  const n = await one<{ n: number }>(`select count(*)::int as n from group_contributions where gift_id=$1`, [t.gift_id]);
  if ((n?.n ?? 0) >= t.max_contributions) return err("full", 409);
  const message = clean(d.message, 500);
  if (!moderate(message + " " + d.name).ok) return err("content_not_allowed", 422);
  const id = newId();
  await q(`insert into group_contributions (id, gift_id, contrib_token_id, name, message, photo_url, voice_url, contact) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    id, t.gift_id, t.id, clean(d.name, 40), message, d.photoUrl ?? null, d.voiceUrl ?? null, d.contact?.email || d.contact?.phone ? d.contact : null,
  ]);
  await recordConsent("contributor", id, "group_contribution", true);
  const v = await visitor();
  await track("contributor_submitted", { anonId: v.anonId, giftId: t.gift_id });
  return json({ id });
}
