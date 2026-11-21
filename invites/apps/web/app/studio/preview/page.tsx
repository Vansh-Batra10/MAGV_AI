"use client";
import { useEffect, useState } from "react";
import { sampleWedding, type GuestVars, type WeddingContent } from "@invites/content-schema";
import type { Mode } from "@invites/renderer";
import { InviteMount } from "@/components/InviteMount";

/** Live preview for the studio. Reads the draft content from localStorage (wizard) or ?w= wedding (editor) via postMessage. */
export default function Preview() {
  const [state, setState] = useState<{ content: WeddingContent; template: string; pack?: string; mode: Mode; t: number; guest: GuestVars } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    let content = sampleWedding;
    try { const raw = localStorage.getItem(q.get("key") ?? "inv:draft"); if (raw) content = JSON.parse(raw); } catch { /* ignore */ }
    const guest: GuestVars = { guestCode: "preview", salutation: q.get("salutation") ?? `${content.bride.name} & ${content.groom.name}`, invitedEventIds: content.events.map((e) => e.id), locale: content.defaultLocale, tone: content.defaultTone, householdMax: 2, shagunVisible: !!content.shagun?.enabled, side: "both", outstation: false, replied: false };
    setState({ content, template: q.get("template") ?? "sheesh-mahal", pack: q.get("pack") ?? undefined, mode: (q.get("mode") as Mode) ?? "interactive", t: Number(q.get("t") ?? 11), guest });
  }, []);
  if (!state) return null;
  return <InviteMount templateId={state.template} themePack={state.pack} content={state.content} guest={state.guest} mode={state.mode} skipLoader={state.mode !== "interactive"}
    onReady={(inv) => { if (state.mode === "static" || state.mode === "autoplay") inv.seek(state.t); }} />;
}
