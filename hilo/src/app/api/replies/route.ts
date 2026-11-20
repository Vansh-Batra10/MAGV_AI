import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { q } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { liveGiftForRecipient } from "@/lib/server/giftAccess";
import { clean, moderate } from "@/lib/server/moderation";
import { notifyReply } from "@/lib/server/notify";
import { track } from "@/lib/server/events";

const B = z.object({
  slug: z.string().max(30),
  kind: z.enum(["heart", "text", "voice", "answer"]),
  text: z.string().max(300).optional(),
  voiceUrl: z.string().regex(/^\/api\/media\/voice\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4}$/).optional(),
});

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("reply", 30, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const g = await liveGiftForRecipient(b.data.slug);
  if (!g) return err("not_found", 404);
  const text = b.data.text ? clean(b.data.text, 300) : null;
  if (text && !moderate(text).ok) return err("content_not_allowed", 422);
  await q(`insert into replies (id, gift_id, kind, text, voice_url) values ($1,$2,$3,$4,$5)`, [newId(), g.id, b.data.kind, text, b.data.voiceUrl ?? null]);
  await notifyReply(g, b.data.kind);
  const v = await visitor();
  await track("reply_sent", { anonId: v.anonId, giftId: g.id, props: { kind: b.data.kind } });
  return json({ ok: true });
}
