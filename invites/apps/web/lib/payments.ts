import { createHmac, timingSafeEqual } from "node:crypto";
import { isMockMode, tiers, type TierId } from "@invites/config";

/**
 * Razorpay (web). MOCK mode marks orders paid immediately. Real mode creates an order via the Razorpay
 * Orders API and the tier is granted only by a verified webhook (`payment.captured`).
 * TODO_VERIFY(GST invoice fields, Razorpay account settings) — see docs/VERIFY.md.
 */
export function priceFor(tier: TierId, currency: "INR" | "USD") {
  const t = tiers[tier];
  return currency === "INR" ? t.inr * 100 : t.usd * 100;
}

export function verifyRazorpayWebhook(rawBody: string, signature: string | null, secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ""): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createRazorpayOrder(amountPaise: number, currency: string, receipt: string): Promise<{ id: string }> {
  if (isMockMode()) return { id: `order_mock_${receipt}` };
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { authorization: `Basic ${auth}`, "content-type": "application/json" }, body: JSON.stringify({ amount: amountPaise, currency, receipt }) });
  if (!r.ok) throw new Error(`razorpay ${r.status}`);
  return r.json();
}
