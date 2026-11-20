"use client";
import { useEffect, useMemo } from "react";
import { RENDERERS } from "@/templates/renderers";
import type { Contribution, GiftContext, RenderMode } from "@/templates/types";
import type { GiftLanguage } from "@/config/markets";
import { STAGE_H, STAGE_W } from "@/components/ui/PhoneFrame";
import { Starfield } from "@/components/ui/Starfield";

export type GiftProps = {
  slug: string;
  giftId: string;
  template: string;
  content: unknown;
  lang: GiftLanguage;
  senderFirstName: string;
  recipientName: string;
  isFree: boolean;
  is24h: boolean;
  expiresAt: string | null;
  contributions?: Contribution[];
  units: "km" | "mi";
  mode?: RenderMode;
};

function device(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

/** Full-screen recipient experience. On wide screens the 9:16 stage is centred over an ambient starfield. */
export function GiftExperience(p: GiftProps) {
  const Renderer = RENDERERS[p.template];
  useEffect(() => {
    if (p.mode && p.mode !== "live") return;
    const k = `hilo_open_${p.slug}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {}
    void fetch("/api/events/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: p.slug, device: device() }) });
  }, [p.slug, p.mode]);

  const ctx: GiftContext = useMemo(
    () => ({
      slug: p.slug,
      giftId: p.giftId,
      lang: p.lang,
      isFree: p.isFree,
      is24h: p.is24h,
      expiresAt: p.expiresAt,
      senderFirstName: p.senderFirstName,
      recipientName: p.recipientName,
      contributions: p.contributions,
      units: p.units,
      sendReply: async (r) => {
        const res = await fetch("/api/replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: p.slug, ...r }) });
        if (!res.ok) throw new Error("reply_failed");
      },
    }),
    [p],
  );

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-ink-950">
      <div className="absolute inset-0 hidden sm:block">
        <div className="absolute inset-0 [background:var(--grad-aurora)]" />
        <Starfield density={0.8} />
      </div>
      <div
        className="relative h-full w-full sm:h-[min(100dvh-32px,960px)] sm:w-auto sm:overflow-hidden sm:rounded-[36px] sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ aspectRatio: undefined }}
      >
        <div className="relative h-full w-full sm:aspect-[390/844]" style={{ maxWidth: "100vw" }}>
          {Renderer ? <Renderer content={p.content} mode={p.mode ?? "live"} watermark={false} ctx={ctx} /> : null}
        </div>
      </div>
    </div>
  );
}

export const STAGE = { w: STAGE_W, h: STAGE_H };
