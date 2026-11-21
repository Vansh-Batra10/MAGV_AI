import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { verifyRazorpayWebhook } from "@/lib/payments";

/** Razorpay webhook: the only place a real payment grants a tier. Signature is verified on the raw body. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyRazorpayWebhook(raw, req.headers.get("x-razorpay-signature"))) return NextResponse.json({ ok: false }, { status: 401 });
  const evt = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
  if (evt.event === "payment.captured") {
    const orderId = evt.payload?.payment?.entity?.order_id;
    const s = store(); const db = s.raw();
    const o = db.orders.find((x) => x.id === orderId);
    if (o && o.status !== "paid") {
      o.status = "paid"; o.providerRef = evt.payload?.payment?.entity?.id;
      const w = db.weddings.find((x) => x.id === o.weddingId);
      if (w) w.tier = o.tier;
      s.flush();
    }
  }
  return NextResponse.json({ ok: true });
}
