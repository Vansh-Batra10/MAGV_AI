import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  if (!allow(`${clientIp(req)}:public:${inviteCode}`, 5)) return NextResponse.json({ ok: false }, { status: 429 });
  const body = z.object({ name: z.string().trim().min(1).max(60), website: z.string().max(0).optional() }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });
  const s = store();
  const w = s.weddingByCode(inviteCode);
  const pub = w?.content.events.filter((e) => e.isPublic).map((e) => e.id) ?? [];
  if (!w || w.status !== "published" || !pub.length) return NextResponse.json({ ok: false }, { status: 404 });
  const [g] = s.addGuests(w.ownerUserId, w.id, [{ salutation: body.data.name, invitedEventIds: pub, locale: w.content.defaultLocale, tone: w.content.defaultTone, householdMax: 2, shagunVisible: false, side: "both", outstation: false, replied: false }]);
  if (!g) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, guestCode: g.guestCode });
}
