import { NextResponse } from "next/server";
import { z } from "zod";
import { WeddingContent } from "@invites/content-schema";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, weddings: store().weddingsFor(u.id).map((w) => ({ id: w.id, names: `${w.content.bride.name} & ${w.content.groom.name}`, templateId: w.templateId, status: w.status, tier: w.tier, inviteCode: w.inviteCode })) });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const b = z.object({ templateId: z.enum(["sheesh-mahal", "rang-kahani", "mohar"]), packId: z.string().max(40), content: WeddingContent }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ ok: false, error: b.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  const w = store().createWedding(u.id, b.data);
  if (u.phone) w.shagunVerifiedAt = new Date().toISOString(); // phone verified at login
  store().flush();
  return NextResponse.json({ ok: true, id: w.id });
}
