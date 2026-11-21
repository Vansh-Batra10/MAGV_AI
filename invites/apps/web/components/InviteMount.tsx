"use client";
import { useEffect, useRef } from "react";
import type { GuestVars, Locale, Tone, WeddingContent } from "@invites/content-schema";
import { mount, type GuestServices, type Invite, type Mode, type Tier } from "@invites/renderer";
import { loadTemplate } from "@/lib/templates";

export interface InviteMountProps {
  templateId: string;
  themePack?: string;
  content: WeddingContent;
  guest: GuestVars;
  mode?: Mode;
  tier?: Tier;
  locale?: Locale;
  tone?: Tone;
  services?: GuestServices;
  skipLoader?: boolean;
  dpr?: number;
  onReady?: (inv: Invite) => void;
}

declare global { interface Window { __invite?: Invite; __inviteReady?: boolean } }

export function InviteMount(p: InviteMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([p.templateId, p.themePack, p.content, p.guest, p.mode, p.tier, p.locale, p.tone, p.skipLoader, p.dpr]);
  useEffect(() => {
    let inv: Invite | null = null;
    let cancelled = false;
    window.__inviteReady = false;
    loadTemplate(p.templateId).then((template) => {
      if (cancelled || !ref.current) return;
      // The server-rendered loader shell is replaced by the template's own loader.
      document.getElementById("inv-ssr-loader")?.remove();
      inv = mount(ref.current, {
        template, themePack: p.themePack, content: p.content, guest: p.guest, mode: p.mode, tier: p.tier,
        locale: p.locale, tone: p.tone, services: p.services, skipLoader: p.skipLoader, dpr: p.dpr, assetsBase: "",
      });
      window.__invite = inv;
      inv.ready.then(() => { window.__inviteReady = true; p.onReady?.(inv!); });
    });
    return () => { cancelled = true; inv?.destroy(); };
  }, [key]);
  return <div ref={ref} />;
}
