import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { getEditableGift, getGiftById } from "@/lib/server/gifts";
import { createOrder, quote } from "@/lib/server/commerce";
import { getProfile } from "@/lib/server/auth";
import { track } from "@/lib/server/events";
import { recordConsent } from "@/lib/server/consent";
import { durationsFor } from "@/config/pricing";

const B = z.object({
  giftId: z.string().max(40),
  duration: z.enum(["h24", "forever"]),
  addons: z.array(z.enum(["extraPhotos", "customMusic", "password"])).default([]),
  coupon: z.string().max(30).optional().nullable(),
  useWallet: z.boolean().default(false),
  email: z.string().email().max(120),
  phone: z.string().max(20).optional().nullable(),
  currency: z.enum(["INR", "USD"]).optional(),
  purpose: z.enum(["purchase", "upgrade"]).default("purchase"),
  payer: z.enum(["sender", "recipient"]).default("sender"),
  quoteOnly: z.boolean().default(false),
  consent: z.boolean().default(false),
});

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("checkout.order", 40, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const d = b.data;
  const v = await visitor();
  // Recipients upgrading a 24h gift don't own it: allow upgrade on any live 24h gift by id.
  const gift = d.payer === "recipient" && d.purpose === "upgrade" ? await getGiftById(d.giftId) : await getEditableGift(d.giftId);
  if (!gift) return err("not_found", 404);
  if (d.purpose === "upgrade" && (gift.duration !== "h24" || !gift.slug)) return err("not_upgradeable", 400);
  if (d.purpose === "purchase" && gift.tier === "free") return err("free_template", 400);
  if (d.purpose === "purchase" && !durationsFor(gift.tier).includes(d.duration)) return err("duration_not_available", 400);
  const currency = d.currency ?? v.currency;
  const profile = await getProfile();
  const qt = await quote({ gift, currency, duration: d.duration, addons: d.addons, coupon: d.coupon, walletMinor: d.useWallet && profile && profile.currency === currency ? profile.wallet_balance_minor : 0, purpose: d.purpose, bucket: gift.experiment_bucket ?? v.bucket });
  if (d.quoteOnly) return json({ quote: qt });
  if (!d.consent) return err("consent_required", 400);
  await recordConsent("buyer", d.email.toLowerCase(), "purchase_and_delivery", true);
  await track("checkout_started", { anonId: v.anonId, giftId: gift.id, props: { purpose: d.purpose, payer: d.payer, total: qt.total, currency } });
  const o = await createOrder({ gift, quote: qt, buyerEmail: d.email, buyerPhone: d.phone, userId: profile?.id ?? null, payer: d.payer, utm: v.utm, coupon: qt.couponError ? null : d.coupon, bucket: gift.experiment_bucket ?? v.bucket });
  return json({ ...o, quote: qt });
}
