import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const b = z.object({ phone: z.string(), code: z.string().regex(/^\d{6}$/) }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ ok: false }, { status: 400 });
  if (!allow(`verify:${clientIp(req)}`, 10)) return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });
  return NextResponse.json({ ok: await verifyOtp(b.data.phone, b.data.code) });
}
