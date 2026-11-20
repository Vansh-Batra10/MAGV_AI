import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { q } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { liveGiftForRecipient } from "@/lib/server/giftAccess";
import { notifyReply } from "@/lib/server/notify";
import { recordConsent } from "@/lib/server/consent";
import { track } from "@/lib/server/events";

const B = z.object({
  slug: z.string().max(30),
  url: z.string().regex(/^\/api\/media\/reaction\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4}$/),
  durationMs: z.number().int().min(0).max(16000),
  publicUseConsent: z.boolean().default(false),
});

/** Opt-in reaction clip: shared only with the sender unless public-use consent is ticked. */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("reaction", 10, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const g = await liveGiftForRecipient(b.data.slug);
  if (!g) return err("not_found", 404);
  const id = newId();
  const key = b.data.url.replace(/^\/api\/media\//, "");
  await q(`insert into reactions (id, gift_id, storage_key, duration_ms, public_use_consent, consent_at) values ($1,$2,$3,$4,$5,$6)`, [id, g.id, key, b.data.durationMs, b.data.publicUseConsent, b.data.publicUseConsent ? new Date() : null]);
  await recordConsent("recipient", id, "reaction_public_use", b.data.publicUseConsent);
  await notifyReply(g, "reaction");
  const v = await visitor();
  await track("reaction_sent", { anonId: v.anonId, giftId: g.id, props: { public: b.data.publicUseConsent } });
  return json({ ok: true });
}
