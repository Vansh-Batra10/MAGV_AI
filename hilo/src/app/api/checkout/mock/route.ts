import { z } from "zod";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { MOCK } from "@/lib/server/env";
import { one, q } from "@/lib/server/db";
import { fulfilOrder } from "@/lib/server/commerce";
import { mockProvider } from "@/lib/server/adapters/payments";

const B = z.object({ orderId: z.string(), outcome: z.enum(["success", "failure"]) });

/** MOCK mode only: simulates the provider and calls the same fulfilment path as the real webhook. */
export async function POST(req: Request) {
  if (!MOCK.payments) return err("not_available", 404);
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const o = await one<{ razorpay_order_id: string }>(`select razorpay_order_id from orders where id=$1`, [b.data.orderId]);
  if (!o) return err("not_found", 404);
  if (b.data.outcome === "failure") {
    await q(`update orders set status='failed' where id=$1 and status='created'`, [b.data.orderId]);
    return json({ ok: false });
  }
  const paymentId = "pay_mock_" + Math.random().toString(36).slice(2, 10);
  // Exercise the signature check exactly like the real handler would.
  const sig = mockProvider.sign(o.razorpay_order_id, paymentId);
  if (!mockProvider.verifyPaymentSignature(o.razorpay_order_id, paymentId, sig)) return err("bad_signature", 400);
  return json(await fulfilOrder(b.data.orderId, paymentId));
}
