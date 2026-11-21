import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";

/** Stores the couple app's Expo push token (new RSVP, song request, pledge, sending-week digest). */
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const b = z.object({ token: z.string().min(10).max(200) }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ ok: false }, { status: 400 });
  const user = store().raw().users.find((x) => x.id === u.id) as (typeof u & { pushTokens?: string[] }) | undefined;
  if (user) { user.pushTokens = Array.from(new Set([...(user.pushTokens ?? []), b.data.token])).slice(-5); store().flush(); }
  return NextResponse.json({ ok: true });
}
