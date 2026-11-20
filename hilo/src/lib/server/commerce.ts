import "server-only";
import { q, one } from "./db";
import { newId } from "@/lib/ids";
import { ADDONS, priceFor, upgradePrice, REFERRAL, type AddonKey, type Duration, type Tier } from "@/config/pricing";
import type { Currency } from "@/config/markets";
import { getGiftById, publishGift, giftUrl, type GiftRow } from "./gifts";
import { paymentProvider } from "./adapters/payments";
import { track } from "./events";
import { notifyPaid, notifyRecipientUpgraded } from "./notify";
import { log } from "./log";
import { now } from "./env";

export type Quote = { currency: Currency; tier: Tier; duration: Duration; base: number; addons: { key: AddonKey; amount: number }[]; couponOff: number; walletUsed: number; total: number; purpose: "purchase" | "upgrade"; couponError?: string };

export async function couponDiscount(code: string | null | undefined, currency: Currency, subtotal: number): Promise<{ off: number; error?: string }> {
  if (!code) return { off: 0 };
  const c = await one<{ code: string; percent_off: number | null; amount_off_minor: number | null; currency: string | null; valid_from: string | null; valid_to: string | null; max_uses: number | null; used_count: number }>(
    `select * from coupons where upper(code)=upper($1)`, [code.trim()]);
  if (!c) return { off: 0, error: "invalid" };
  const t = now();
  if ((c.valid_from && new Date(c.valid_from) > t) || (c.valid_to && new Date(c.valid_to) < t)) return { off: 0, error: "expired" };
  if (c.max_uses !== null && c.used_count >= c.max_uses) return { off: 0, error: "used_up" };
  if (c.percent_off) return { off: Math.round((subtotal * c.percent_off) / 100) };
  if (c.amount_off_minor && (!c.currency || c.currency === currency)) return { off: Math.min(subtotal, c.amount_off_minor) };
  return { off: 0, error: "invalid" };
}

/** Server-side price computation. Never trust client prices. */
export async function quote(input: { gift: GiftRow; currency: Currency; tier?: Tier; duration: Duration; addons?: AddonKey[]; coupon?: string | null; walletMinor?: number; purpose?: "purchase" | "upgrade"; bucket?: string | null; referralCode?: string | null; buyerEmail?: string | null }): Promise<Quote> {
  const purpose = input.purpose ?? "purchase";
  const tier = input.tier ?? input.gift.tier;
  let base: number;
  let duration = input.duration;
  if (purpose === "upgrade") {
    base = upgradePrice(input.currency, input.gift.tier, input.bucket);
    duration = "forever";
  } else {
    const p = priceFor(input.currency, tier, duration, input.bucket);
    if (p === null) throw new Error("duration_not_available");
    base = p;
  }
  const addons = (input.addons ?? []).filter((k) => k in ADDONS && k !== "password").map((key) => ({ key, amount: ADDONS[key][input.currency] }));
  const subtotal = base + addons.reduce((s, a) => s + a.amount, 0);
  let { off: couponOff, error: couponError } = await couponDiscount(input.coupon, input.currency, subtotal);
  // Referral: a friend's code gives a fixed amount off the first paid gift (when no coupon is used).
  if (!couponOff && input.referralCode && input.referralCode !== "gift" && purpose === "purchase") {
    const ref = await one<{ id: string; email: string }>(`select id, email from profiles where referral_code=$1`, [input.referralCode.toUpperCase()]);
    const prior = input.buyerEmail ? await one(`select 1 from orders where lower(buyer_email)=lower($1) and status='paid' limit 1`, [input.buyerEmail]) : null;
    if (ref && !prior && ref.email !== input.buyerEmail?.toLowerCase()) {
      couponOff = Math.min(subtotal, REFERRAL.refereeOffMinor[input.currency]);
      couponError = undefined;
    }
  }
  const afterCoupon = Math.max(0, subtotal - couponOff);
  const walletUsed = Math.min(afterCoupon, Math.max(0, input.walletMinor ?? 0));
  return { currency: input.currency, tier: purpose === "upgrade" ? input.gift.tier : tier, duration, base, addons, couponOff, walletUsed, total: afterCoupon - walletUsed, purpose, couponError };
}

export async function createOrder(input: { gift: GiftRow; quote: Quote; buyerEmail?: string | null; buyerPhone?: string | null; userId?: string | null; payer: "sender" | "recipient"; utm?: unknown; coupon?: string | null; bucket?: string | null }) {
  const id = newId();
  const provider = paymentProvider(input.quote.currency);
  const created = input.quote.total > 0 ? await provider.createOrder({ amountMinor: input.quote.total, currency: input.quote.currency, receipt: id, notes: { gift: input.gift.id } }) : null;
  await q(
    `insert into orders (id, gift_id, user_id, purpose, payer, buyer_email, buyer_phone, currency, amount_minor, tier, duration, addons, coupon_code, wallet_used_minor, provider, razorpay_order_id, status, experiment_bucket, utm)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'created',$17,$18)`,
    [id, input.gift.id, input.userId ?? null, input.quote.purpose, input.payer, input.buyerEmail ?? null, input.buyerPhone ?? null, input.quote.currency, input.quote.total, input.quote.tier, input.quote.duration, input.quote.addons.map((a) => a.key), input.coupon ?? null, input.quote.walletUsed, provider.name, created?.providerOrderId ?? null, input.bucket ?? null, input.utm ?? null],
  );
  if (!created) {
    // Fully covered by coupon/wallet: fulfil immediately.
    await fulfilOrder(id, "free_" + id);
  }
  return { orderId: id, checkout: created?.checkout ?? null, provider: provider.name };
}

/**
 * Idempotent fulfilment — the single code path used by the Razorpay webhook, the client handler verification
 * and the MOCK checkout.
 */
export async function fulfilOrder(orderId: string, paymentId: string): Promise<{ ok: boolean; slug?: string; already?: boolean }> {
  const o = await one<{ id: string; gift_id: string; status: string; purpose: string; payer: string; tier: Tier; duration: Duration; wallet_used_minor: number; user_id: string | null; coupon_code: string | null; buyer_email: string | null; currency: Currency; amount_minor: number; utm: any }>(
    `select * from orders where id=$1`, [orderId]);
  if (!o) return { ok: false };
  if (o.status === "paid") {
    const g = await getGiftById(o.gift_id);
    return { ok: true, slug: g?.slug ?? undefined, already: true };
  }
  const updated = await q(`update orders set status='paid', razorpay_payment_id=$2, paid_at=now() where id=$1 and status <> 'paid' returning id`, [orderId, paymentId]);
  if (!updated.length) return { ok: true, already: true };

  const gift = (await getGiftById(o.gift_id))!;
  let slug: string;
  if (o.purpose === "upgrade") {
    await q(`update gifts set duration='forever', expires_at_utc=null, tier=case when tier='free' then 'mini' else tier end, updated_at=now() where id=$1`, [gift.id]);
    slug = gift.slug!;
    await track("keep_forever_paid", { giftId: gift.id, props: { payer: o.payer } });
    if (o.payer === "recipient") await notifyRecipientUpgraded(gift);
  } else {
    slug = await publishGift(gift.id, { tier: o.tier, duration: o.duration });
    await track("payment_success", { giftId: gift.id, userId: o.user_id, props: { tier: o.tier, duration: o.duration, currency: o.currency, amount: o.amount_minor, template: gift.template_slug } });
  }
  if (o.coupon_code) await q(`update coupons set used_count = used_count + 1 where upper(code)=upper($1)`, [o.coupon_code]);
  if (o.wallet_used_minor > 0 && o.user_id) await q(`update profiles set wallet_balance_minor = greatest(0, wallet_balance_minor - $2) where id=$1`, [o.user_id, o.wallet_used_minor]);
  await creditReferral(o);
  try {
    if (o.purpose !== "upgrade") await notifyPaid(await getGiftById(gift.id) as GiftRow, o.buyer_email, giftUrl(slug));
  } catch (err) {
    log.error("notify.paid_failed", { error: String(err) });
  }
  return { ok: true, slug };
}

async function creditReferral(o: { id: string; utm: any; buyer_email: string | null; currency: Currency }) {
  const ref = o.utm?.ref;
  if (!ref || ref === "gift") return;
  const referrer = await one<{ id: string; email: string }>(`select id, email from profiles where referral_code=$1`, [String(ref).toUpperCase()]);
  if (!referrer || referrer.email === o.buyer_email) return;
  const exists = await one(`select 1 from referrals where order_id=$1`, [o.id]);
  if (exists) return;
  await q(`insert into referrals (id, referrer_id, referee_email, order_id, credited) values ($1,$2,$3,$4,true)`, [newId(), referrer.id, o.buyer_email, o.id]);
  await q(`update profiles set wallet_balance_minor = wallet_balance_minor + $2 where id=$1`, [referrer.id, REFERRAL.referrerCreditMinor[o.currency]]);
}
