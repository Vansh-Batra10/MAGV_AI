import { z } from "zod";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { getEditableGift, ensureContribToken } from "@/lib/server/gifts";
import { q } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { now } from "@/lib/server/env";

const S = z.object({
  password: z.string().max(64).nullable().optional(),
  recipientContact: z.object({ phone: z.string().max(20).optional(), email: z.string().email().max(120).optional().or(z.literal("")) }).optional(),
  senderContact: z.object({ phone: z.string().max(20).optional(), email: z.string().email().max(120).optional().or(z.literal("")), optIn: z.boolean().optional() }).optional(),
  deliverAtUtc: z.string().datetime().nullable().optional(),
  revealAtUtc: z.string().datetime().nullable().optional(),
  recipientTz: z.string().max(60).optional(),
  contribDeadlineUtc: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const g = await getEditableGift((await params).id);
  if (!g) return err("not_found", 404);
  const b = await body(req, S);
  if (!b.ok) return b.res;
  const d = b.data;
  if (d.recipientTz) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: d.recipientTz });
    } catch {
      return err("bad_timezone");
    }
  }
  if (d.password !== undefined) await q(`update gifts set password_hash=$2 where id=$1`, [g.id, d.password ? await hashPassword(d.password) : null]);
  if (d.recipientContact) await q(`update gifts set recipient_contact=$2 where id=$1`, [g.id, d.recipientContact]);
  if (d.senderContact) await q(`update gifts set sender_contact=$2 where id=$1`, [g.id, d.senderContact]);
  if (d.recipientTz) await q(`update gifts set recipient_tz=$2 where id=$1`, [g.id, d.recipientTz]);
  if (d.deliverAtUtc !== undefined) {
    const at = d.deliverAtUtc ? new Date(d.deliverAtUtc) : null;
    const status = g.status === "draft" ? "draft" : at && at > now() ? "scheduled" : g.status === "scheduled" ? "paid" : g.status;
    await q(`update gifts set deliver_at_utc=$2, status=$3, delivered_at=case when $2::timestamptz is null then delivered_at else null end where id=$1`, [g.id, at, status]);
  }
  if (d.revealAtUtc !== undefined) await q(`update gifts set reveal_at_utc=$2 where id=$1`, [g.id, d.revealAtUtc ? new Date(d.revealAtUtc) : null]);
  if (g.mode === "group") {
    const token = await ensureContribToken(g.id, g.tier);
    if (d.contribDeadlineUtc !== undefined) await q(`update contrib_tokens set deadline_utc=$2 where gift_id=$1`, [g.id, d.contribDeadlineUtc ? new Date(d.contribDeadlineUtc) : null]);
    return json({ ok: true, contribToken: token });
  }
  return json({ ok: true });
}
