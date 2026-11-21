import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp } from "@/lib/auth";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const b = z.object({ phone: z.string().regex(/^\+[1-9]\d{7,14}$/) }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ ok: false, error: "Enter the phone with country code, e.g. +9198…" }, { status: 400 });
  if (!allow(`otp:${clientIp(req)}`, 5) || !allow(`otp:${b.data.phone}`, 3)) return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });
  return NextResponse.json({ ok: true, ...issueOtp(b.data.phone) });
}
