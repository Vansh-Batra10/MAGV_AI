import { NextResponse } from "next/server";
import { z } from "zod";
import { RsvpSubmission } from "@invites/content-schema";
import { AccessDenied } from "@invites/db";
import { store } from "@/lib/store";
import { allow, clientIp } from "@/lib/rate-limit";

type P = { params: Promise<{ inviteCode: string; guestCode: string; action: string }> };

const bodies = {
  rsvp: RsvpSubmission,
  pledge: z.object({ blockId: z.string().min(1).max(40), amount: z.number().int().positive().nullable() }),
  claim: z.object({ giftId: z.string().min(1).max(40) }),
  vote: z.object({ team: z.enum(["ladkewale", "ladkiwale"]) }),
  song: z.object({ text: z.string().trim().min(1).max(100) }),
  sign: z.object({ blessing: z.string().max(160).default(""), signatureSvg: z.string().max(20000).optional() }),
  open: z.object({ scene: z.string().max(40).optional(), tier: z.enum(["A", "B", "C"]).optional() }),
  report: z.object({ reason: z.string().trim().min(1).max(500) }),
} as const;

export async function POST(req: Request, { params }: P) {
  const { inviteCode, guestCode, action } = await params;
  if (!(action in bodies)) return NextResponse.json({ ok: false, error: "unknown action" }, { status: 404 });
  const limit = action === "open" ? 60 : action === "rsvp" ? 10 : 20;
  if (!allow(`${clientIp(req)}:${guestCode}:${action}`, limit)) return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  const s = store();
  const b = s.guestBundle(inviteCode, guestCode);
  if (!b) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const parsed = bodies[action as keyof typeof bodies].safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const { guest, wedding } = b;
  const d = parsed.data as any; // validated by the zod schema for this action
  try {
    switch (action) {
      case "rsvp": s.saveRsvp(guest, parsed.data as z.infer<typeof RsvpSubmission>); break;
      case "pledge": s.pledge(guest, d.blockId, d.amount); break;
      case "claim": return NextResponse.json({ ok: s.claimGift(guest, d.giftId) });
      case "vote": return NextResponse.json({ ok: true, counts: s.vote(guest, d.team) });
      case "song": s.song(guest, d.text); break;
      case "sign": s.sign(guest, d.blessing, d.signatureSvg); break;
      case "open": s.recordOpen(guest, { scene: d.scene, tier: d.tier, ua: uaFamily(req.headers.get("user-agent") ?? "") }); break;
      case "report": s.report(wedding.id, d.reason); break;
    }
  } catch (e) {
    if (e instanceof AccessDenied) return NextResponse.json({ ok: false, error: "not allowed" }, { status: 403 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

function uaFamily(ua: string): string {
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad/i.test(ua)) return "ios";
  return "desktop";
}
