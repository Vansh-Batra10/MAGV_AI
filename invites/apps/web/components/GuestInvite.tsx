"use client";
import { useMemo } from "react";
import type { GuestServices } from "@invites/renderer";
import { InviteMount } from "./InviteMount";
import type { GuestViewData } from "@/lib/guest-view";

async function post<T = { ok: boolean }>(url: string, body: unknown): Promise<T> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true });
    return (await r.json()) as T;
  } catch { return { ok: false, error: "network" } as T; }
}

export function GuestInvite({ data, inviteCode, guestCode, shareUrl }: { data: GuestViewData; inviteCode: string; guestCode: string; shareUrl: string }) {
  const services = useMemo<GuestServices>(() => {
    const u = (a: string) => `/api/g/${inviteCode}/${guestCode}/${a}`;
    return {
      submitRsvp: (sub) => post(u("rsvp"), sub),
      pledge: (p) => post(u("pledge"), p),
      claimGift: (giftId) => post(u("claim"), { giftId }),
      vote: (team) => post(u("vote"), { team }),
      requestSong: (text) => post(u("song"), { text }),
      sign: (p) => post(u("sign"), p),
      report: async (reason) => { await post(u("report"), { reason }); },
      track: (e) => { void post(u("open"), e); },
      existingRsvp: data.existingRsvp,
      publicCounts: data.publicCounts,
      shareUrl,
    };
  }, [inviteCode, guestCode, data, shareUrl]);
  return <InviteMount templateId={data.templateId} themePack={data.packId} content={data.content} guest={data.guest} services={services} />;
}
