import { paymentProvider } from "@/lib/server/adapters/payments";
import { q, one } from "@/lib/server/db";
import { newId } from "@/lib/ids";
import { fulfilOrder } from "@/lib/server/commerce";
import { log } from "@/lib/server/log";

/** Razorpay webhook: signature-verified and idempotent (payments_events.provider_event_id is unique). */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  if (!paymentProvider("INR").verifyWebhook(raw, sig)) return new Response("bad signature", { status: 400 });
  const evt = JSON.parse(raw) as { event: string; payload: any };
  const eventId = req.headers.get("x-razorpay-event-id") ?? `${evt.event}:${evt.payload?.payment?.entity?.id ?? evt.payload?.order?.entity?.id}`;
  const ins = await q(`insert into payments_events (id, provider_event_id, payload) values ($1,$2,$3) on conflict (provider_event_id) do nothing returning id`, [newId(), eventId, evt]);
  if (!ins.length) return new Response("duplicate", { status: 200 });
  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    const rzpOrderId = evt.payload?.payment?.entity?.order_id ?? evt.payload?.order?.entity?.id;
    const paymentId = evt.payload?.payment?.entity?.id ?? "unknown";
    const o = await one<{ id: string }>(`select id from orders where razorpay_order_id=$1`, [rzpOrderId]);
    if (o) await fulfilOrder(o.id, paymentId);
    else log.warn("webhook.order_not_found", { rzpOrderId });
  } else if (evt.event === "payment.failed") {
    const rzpOrderId = evt.payload?.payment?.entity?.order_id;
    await q(`update orders set status='failed' where razorpay_order_id=$1 and status='created'`, [rzpOrderId]);
  } else if (evt.event === "refund.processed") {
    const paymentId = evt.payload?.refund?.entity?.payment_id;
    await q(`update orders set status='refunded' where razorpay_payment_id=$1`, [paymentId]);
  }
  return new Response("ok");
}
