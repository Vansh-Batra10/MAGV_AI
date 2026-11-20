import "server-only";
import crypto from "node:crypto";
import { ENV, MOCK } from "../env";
import type { Currency } from "@/config/markets";

export type CreatedOrder = {
  provider: "razorpay" | "mock" | "mor";
  providerOrderId: string;
  /** Data the client needs to open checkout. */
  checkout: Record<string, unknown>;
};

export interface PaymentProvider {
  name: "razorpay" | "mock" | "mor";
  createOrder(input: { amountMinor: number; currency: Currency; receipt: string; notes?: Record<string, string> }): Promise<CreatedOrder>;
  /** Verify the client-side handler signature (order_id|payment_id). */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  /** Verify a webhook's raw body signature. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}

class RazorpayProvider implements PaymentProvider {
  name = "razorpay" as const;
  async createOrder({ amountMinor, currency, receipt, notes }: { amountMinor: number; currency: Currency; receipt: string; notes?: Record<string, string> }) {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${ENV.razorpayKeyId}:${ENV.razorpayKeySecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amountMinor, currency, receipt, notes }),
    });
    if (!res.ok) throw new Error(`razorpay order ${res.status}: ${await res.text()}`);
    const o = (await res.json()) as { id: string };
    return { provider: this.name, providerOrderId: o.id, checkout: { key: ENV.razorpayKeyId, order_id: o.id, amount: amountMinor, currency } };
  }
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const exp = crypto.createHmac("sha256", ENV.razorpayKeySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return safeEq(exp, signature);
  }
  verifyWebhook(rawBody: string, signature: string | null) {
    if (!signature || !ENV.razorpayWebhookSecret) return false;
    const exp = crypto.createHmac("sha256", ENV.razorpayWebhookSecret).update(rawBody).digest("hex");
    return safeEq(exp, signature);
  }
}

class MockProvider implements PaymentProvider {
  name = "mock" as const;
  async createOrder({ amountMinor, currency, receipt }: { amountMinor: number; currency: Currency; receipt: string }) {
    const id = "order_mock_" + crypto.randomBytes(6).toString("hex");
    return { provider: this.name, providerOrderId: id, checkout: { mock: true, order_id: id, amount: amountMinor, currency, receipt } };
  }
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const exp = crypto.createHmac("sha256", ENV.authSecret).update(`${orderId}|${paymentId}`).digest("hex");
    return safeEq(exp, signature);
  }
  sign(orderId: string, paymentId: string) {
    return crypto.createHmac("sha256", ENV.authSecret).update(`${orderId}|${paymentId}`).digest("hex");
  }
  verifyWebhook() {
    return false;
  }
}

/**
 * Merchant-of-Record slot (Paddle / Lemon Squeezy) for the Global edition. Not implemented in v1 — behind
 * the HILO_MOR_PROVIDER flag (see docs/SETUP.md). Kept so the switch is a config change, not a rebuild.
 */
class MorProviderStub implements PaymentProvider {
  name = "mor" as const;
  async createOrder(): Promise<CreatedOrder> {
    throw new Error("Merchant-of-Record provider not configured");
  }
  verifyPaymentSignature() {
    return false;
  }
  verifyWebhook() {
    return false;
  }
}

function safeEq(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export const mockProvider = new MockProvider();

export function paymentProvider(currency: Currency): PaymentProvider {
  if (currency === "USD" && process.env.HILO_MOR_PROVIDER) return new MorProviderStub();
  return MOCK.payments ? mockProvider : new RazorpayProvider();
}
