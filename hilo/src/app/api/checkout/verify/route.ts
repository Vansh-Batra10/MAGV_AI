import { z } from "zod";
import { body, err, json } from "@/lib/server/http";
import { one } from "@/lib/server/db";
import { fulfilOrder } from "@/lib/server/commerce";
import { paymentProvider } from "@/lib/server/adapters/payments";

const B = z.object({ orderId: z.string(), razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() });

/** Razorpay Checkout handler → verify signature → fulfil (webhook does the same, idempotently). */
export async function POST(req: Request) {
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const o = await one<{ razorpay_order_id: string; currency: "INR" | "USD" }>(`select razorpay_order_id, currency from orders where id=$1`, [b.data.orderId]);
  if (!o || o.razorpay_order_id !== b.data.razorpay_order_id) return err("order_mismatch", 400);
  if (!paymentProvider(o.currency).verifyPaymentSignature(b.data.razorpay_order_id, b.data.razorpay_payment_id, b.data.razorpay_signature)) return err("bad_signature", 400);
  const r = await fulfilOrder(b.data.orderId, b.data.razorpay_payment_id);
  return json(r);
}
