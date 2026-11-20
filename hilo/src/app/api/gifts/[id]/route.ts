import { z } from "zod";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { getEditableGift, updateGiftContent } from "@/lib/server/gifts";
import { q } from "@/lib/server/db";
import { moderate } from "@/lib/server/moderation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await getEditableGift((await params).id);
  if (!g) return err("not_found", 404);
  return json({ id: g.id, templateSlug: g.template_slug, content: g.content, giftLanguage: g.gift_language, status: g.status, slug: g.slug, tier: g.tier, duration: g.duration });
}

const Patch = z.object({ content: z.unknown(), giftLanguage: z.enum(["en", "hi-Latn", "hi"]).optional(), createdVia: z.enum(["questions", "form"]).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const g = await getEditableGift((await params).id);
  if (!g) return err("not_found", 404);
  const b = await body(req, Patch);
  if (!b.ok) return b.res;
  const m = moderate(JSON.stringify(b.data.content ?? ""));
  if (!m.ok) return err("content_not_allowed", 422);
  const r = await updateGiftContent(g, b.data.content, { giftLanguage: b.data.giftLanguage, createdVia: b.data.createdVia });
  if (!r.ok) return err("invalid_content", 422, { detail: r.error });
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const g = await getEditableGift((await params).id);
  if (!g) return err("not_found", 404);
  await q(`update gifts set status='deleted', content='{}'::jsonb, updated_at=now() where id=$1`, [g.id]);
  await q(`delete from reactions where gift_id=$1`, [g.id]);
  await q(`delete from group_contributions where gift_id=$1`, [g.id]);
  return json({ ok: true });
}
