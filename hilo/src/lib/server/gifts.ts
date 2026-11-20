import "server-only";
import { cookies } from "next/headers";
import { q, one } from "./db";
import { newId, newSlug, newToken } from "@/lib/ids";
import { getTemplate } from "@/templates/registry";
import { getSession } from "./auth";
import { now } from "./env";
import type { Duration, Tier } from "@/config/pricing";
import type { GiftLanguage, Market } from "@/config/markets";
import { GROUP_LIMITS } from "@/config/pricing";

export type GiftRow = {
  id: string; owner_id: string | null; draft_token: string | null; template_slug: string; mode: string; content: any; theme: string | null;
  status: string; slug: string | null; password_hash: string | null; sender_name: string | null; sender_contact: any; recipient_name: string | null;
  recipient_contact: any; recipient_tz: string | null; deliver_at_utc: string | null; reveal_at_utc: string | null; delivered_at: string | null; paid_at: string | null;
  market: Market; gift_language: GiftLanguage; tier: Tier; duration: Duration; expires_at_utc: string | null; song_embed: any; created_via: string;
  experiment_bucket: string | null; takedown_status: string; first_opened_at: string | null; created_at: string; updated_at: string; utm: any;
};

export const DRAFT_COOKIE = "hilo_draft";

export async function draftToken(create = false): Promise<string | null> {
  const c = await cookies();
  let t = c.get(DRAFT_COOKIE)?.value ?? null;
  if (!t && create) {
    t = newToken();
    c.set(DRAFT_COOKIE, t, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90, secure: process.env.NODE_ENV === "production" });
  }
  return t;
}

export async function createDraft(input: { templateSlug: string; content: unknown; giftLanguage: GiftLanguage; market: Market; createdVia: "questions" | "form"; bucket?: string | null; utm?: unknown }) {
  const tpl = getTemplate(input.templateSlug);
  if (!tpl) throw new Error("unknown_template");
  const parsed = tpl.schema.safeParse(input.content);
  const content = parsed.success ? parsed.data : tpl.defaults(input.giftLanguage);
  const session = await getSession();
  const token = await draftToken(true);
  const id = newId();
  const tier = tpl.meta.tier;
  await q(
    `insert into gifts (id, owner_id, draft_token, template_slug, mode, content, status, market, gift_language, tier, duration, created_via, experiment_bucket, recipient_name, sender_name, utm)
     values ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [id, session?.uid ?? null, token, tpl.meta.slug, tpl.meta.mode === "group" ? "group" : "individual", content, input.market, input.giftLanguage, tier, tier === "free" ? "h24" : "forever", input.createdVia, input.bucket ?? null, (content as any).recipientName ?? null, (content as any).senderName ?? null, input.utm ?? null],
  );
  return id;
}

/** Edit access: the browser that created the draft, or the signed-in owner. */
export async function getEditableGift(id: string): Promise<GiftRow | null> {
  const g = await one<GiftRow>(`select * from gifts where id=$1 and status <> 'deleted'`, [id]);
  if (!g) return null;
  const token = await draftToken();
  const s = await getSession();
  if ((token && g.draft_token === token) || (s && g.owner_id === s.uid)) return g;
  return null;
}

export async function updateGiftContent(g: GiftRow, content: unknown, extra: { giftLanguage?: GiftLanguage; createdVia?: string } = {}) {
  const tpl = getTemplate(g.template_slug)!;
  const parsed = tpl.schema.safeParse(content);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const c = parsed.data as any;
  await q(`update gifts set content=$2, recipient_name=$3, sender_name=$4, gift_language=coalesce($5, gift_language), created_via=coalesce($6, created_via), updated_at=now() where id=$1`, [
    g.id, c, c.recipientName ?? null, c.senderName ?? null, extra.giftLanguage ?? null, extra.createdVia ?? null,
  ]);
  return { ok: true as const };
}

export async function getGiftBySlug(slug: string): Promise<GiftRow | null> {
  return one<GiftRow>(`select * from gifts where slug=$1`, [slug]);
}

export async function getGiftById(id: string): Promise<GiftRow | null> {
  return one<GiftRow>(`select * from gifts where id=$1`, [id]);
}

export function isLive(g: GiftRow, at = now()): "live" | "draft" | "expired" | "removed" | "locked" {
  if (g.status === "deleted" || g.takedown_status !== "none") return "removed";
  if (!g.slug || g.status === "draft") return "draft";
  if (g.expires_at_utc && new Date(g.expires_at_utc) < at) return "expired";
  if (g.reveal_at_utc && new Date(g.reveal_at_utc) > at) return "locked";
  return "live";
}

/** Public content for the recipient: strip internal fields. */
export function publicContent(g: GiftRow) {
  const c = { ...(g.content ?? {}) };
  if (g.mode === "group") delete c.sample;
  return c;
}

export async function publishGift(giftId: string, opts: { tier: Tier; duration: Duration; hours?: number }) {
  const g = await getGiftById(giftId);
  if (!g) throw new Error("gift_not_found");
  const slug = g.slug ?? newSlug();
  const expires = opts.duration === "h24" ? new Date(now().getTime() + (opts.hours ?? 24) * 3600_000) : null;
  const status = g.deliver_at_utc && new Date(g.deliver_at_utc) > now() ? "scheduled" : "paid";
  await q(`update gifts set slug=$2, tier=$3, duration=$4, expires_at_utc=$5, status=$6, paid_at=coalesce(paid_at, now()), updated_at=now() where id=$1`, [giftId, slug, opts.tier, opts.duration, expires, status]);
  if (g.mode === "group") await ensureContribToken(giftId, opts.tier);
  return slug;
}

export async function ensureContribToken(giftId: string, tier: Tier = "group") {
  const existing = await one<{ token: string }>(`select token from contrib_tokens where gift_id=$1`, [giftId]);
  if (existing) {
    await q(`update contrib_tokens set max_contributions=$2 where gift_id=$1`, [giftId, tier === "group_plus" ? GROUP_LIMITS.group_plus : GROUP_LIMITS.group]);
    return existing.token;
  }
  const token = newToken();
  await q(`insert into contrib_tokens (id, gift_id, token, max_contributions) values ($1,$2,$3,$4)`, [newId(), giftId, token, tier === "group_plus" ? GROUP_LIMITS.group_plus : GROUP_LIMITS.group]);
  return token;
}

export async function contributionsFor(giftId: string, includeHidden = false) {
  return q<{ id: string; name: string; message: string; photo_url: string | null; voice_url: string | null; hidden: boolean; created_at: string; contact: any }>(
    `select id, name, message, photo_url, voice_url, hidden, created_at, contact from group_contributions where gift_id=$1 ${includeHidden ? "" : "and hidden=false"} order by created_at asc limit 100`, [giftId]);
}

export function giftUrl(slug: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/g/${slug}`;
}
