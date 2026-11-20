import { z } from "zod";
import { body, err, json, limit, sameOrigin } from "@/lib/server/http";
import { q } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { getGiftBySlug } from "@/lib/server/gifts";
import { notifyTakedown } from "@/lib/server/notify";
import { send } from "@/lib/server/adapters/messaging";
import { BRAND } from "@/config/brand";
import { clean } from "@/lib/server/moderation";

const B = z.object({ slug: z.string().max(30), kind: z.enum(["takedown", "abuse"]), reason: z.string().max(500).optional(), contact: z.string().max(120).optional() });

/** Recipient controls: takedown hides the gift immediately pending review; abuse reports go to admin. */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("takedown", 10, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const g = await getGiftBySlug(b.data.slug);
  if (!g) return err("not_found", 404);
  await q(`insert into takedowns (id, gift_id, kind, reason, contact) values ($1,$2,$3,$4,$5)`, [newId(), g.id, b.data.kind, b.data.reason ? clean(b.data.reason, 500) : null, b.data.contact ?? null]);
  if (b.data.kind === "takedown") {
    await q(`update gifts set takedown_status='requested', updated_at=now() where id=$1`, [g.id]);
    await notifyTakedown(g);
  }
  await send({ channel: "email", to: BRAND.grievanceOfficer.email, template: "admin_takedown", category: "utility", subject: `[${b.data.kind}] gift ${g.id}`, text: `${b.data.kind} for gift ${g.id} (${g.template_slug}). Reason: ${b.data.reason ?? "-"}. Review at /admin.` });
  return json({ ok: true });
}
