import { notFound } from "next/navigation";
import type { GuestVars } from "@invites/content-schema";
import { isMockMode } from "@invites/config";
import { store } from "@/lib/store";
import { guestView } from "@/lib/guest-view";
import { RenderClient } from "./RenderClient";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ inviteCode: string }>; searchParams: Promise<Record<string, string | undefined>> };

/** Headless render target for the render worker (autoplay/static). Guarded by RENDER_TOKEN outside MOCK mode. */
export default async function RenderPage({ params, searchParams }: P) {
  const { inviteCode } = await params;
  const q = await searchParams;
  if (!isMockMode() && q.token !== process.env.RENDER_TOKEN) notFound();
  const s = store();
  const w = s.weddingByCode(inviteCode);
  if (!w) notFound();
  let data;
  if (q.guest) {
    const b = s.guestBundle(inviteCode, q.guest);
    if (!b) notFound();
    data = guestView(b.wedding, b.guest);
  } else {
    const grp = w.groups.find((g) => g.id === q.group)?.defaults ?? {};
    const locale = (q.locale as GuestVars["locale"]) ?? grp.locale ?? w.content.defaultLocale;
    const generic: GuestVars = {
      guestCode: "video", salutation: locale === "en" ? "Our loved ones" : locale === "hi" ? "सभी स्नेहीजन" : "Aap sab", invitedEventIds: grp.invitedEventIds ?? w.content.events.map((e) => e.id),
      locale, tone: grp.tone ?? w.content.defaultTone, householdMax: 2, shagunVisible: false, side: "both", outstation: false, replied: false,
    };
    data = { ...guestView(w, { ...generic, id: "video", weddingId: w.id, createdAt: "" }), guest: generic };
  }
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return <RenderClient data={data} mode={q.mode === "static" ? "static" : "autoplay"} t={Number(q.t ?? NaN)} tier={(q.tier as "A") ?? "A"} shareUrl={q.guest ? `${base}/${inviteCode}/${q.guest}` : `${base}/${inviteCode}`} />;
}
