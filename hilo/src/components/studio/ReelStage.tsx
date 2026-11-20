"use client";
import { useEffect, useState } from "react";
import { RENDERERS } from "@/templates/renderers";
import type { RenderMode } from "@/templates/types";
import type { GiftLanguage } from "@/config/markets";
import { ScaledStage } from "@/components/ui/PhoneFrame";

/** Plays a template at exactly 1080×1920 (a 432×768 logical stage scaled 2.5×), scaled to fit the window. */
export function ReelStage({ template, content, lang, speed, mode, autostart }: { template: string; content: unknown; lang: GiftLanguage; speed: number; mode: RenderMode; autostart: boolean }) {
  const [started, setStarted] = useState(autostart || mode !== "reel");
  const [fit, setFit] = useState(1);
  const R = RENDERERS[template];
  useEffect(() => {
    const on = () => setFit(Math.min(window.innerWidth / 1080, window.innerHeight / 1920));
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div style={{ width: 1080 * fit, height: 1920 * fit }} className="relative overflow-hidden" data-reel-stage>
        {started ? (
          <ScaledStage w={432} h={768}>
            <R content={content} mode={mode} watermark={false} ctx={{ lang, speed, recipientName: (content as { recipientName?: string }).recipientName, senderFirstName: (content as { senderName?: string }).senderName }} />
          </ScaledStage>
        ) : (
          <button type="button" onClick={() => setStarted(true)} className="absolute inset-0 grid place-items-center text-white/60" data-start>
            Click to start recording
          </button>
        )}
      </div>
    </div>
  );
}
