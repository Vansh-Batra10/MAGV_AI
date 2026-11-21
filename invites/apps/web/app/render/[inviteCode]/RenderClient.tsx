"use client";
import { InviteMount } from "@/components/InviteMount";
import type { GuestViewData } from "@/lib/guest-view";

export function RenderClient({ data, mode, t, tier, shareUrl }: { data: GuestViewData; mode: "autoplay" | "static"; t: number; tier: "A" | "B" | "C"; shareUrl: string }) {
  return (
    <InviteMount templateId={data.templateId} themePack={data.packId} content={data.content} guest={data.guest} mode={mode} tier={tier} skipLoader
      services={{ submitRsvp: async () => ({ ok: true }), pledge: async () => ({ ok: true }), claimGift: async () => ({ ok: true }), track: () => {}, publicCounts: data.publicCounts, shareUrl }}
      onReady={(inv) => { const at = Number.isFinite(t) ? t : inv.storyboard?.staticAt ?? 0; inv.seek(at); }} />
  );
}
