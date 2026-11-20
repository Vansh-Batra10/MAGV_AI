"use client";
import { useRef } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene } from "@/engines/shell/GiftShell";
import { ReplyCard, TypeOut, heartBurst, handFont, FloatingHearts } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { Polaroid } from "@/components/art";
import { BRAND } from "@/config/brand";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";

export default function QuickSurprise({ content, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const burst = useRef<HTMLDivElement>(null);
  const scenes: Scene[] = [
    ...(content.photo
      ? [{
          id: "photo",
          reelMs: 3200,
          tapToContinue: true,
          render: () => (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-10">
              <motion.div initial={{ y: -500, rotate: -18 }} animate={{ y: 0, rotate: -4 }} transition={{ type: "spring", stiffness: 70, damping: 12 }} className="w-[78%]">
                <Polaroid src={content.photo} caption={content.recipientName} />
              </motion.div>
            </div>
          ),
        } satisfies Scene]
      : []),
    {
      id: "message",
      reelMs: 6200,
      tapToContinue: true,
      render: ({ auto }) => (
        <div className="flex h-full flex-col items-center justify-center px-7">
          <div className="glass-strong w-full p-7">
            <p className="eyebrow mb-4 !text-[10px]">{t("forName", { name: content.recipientName })}</p>
            <p className="text-[24px] leading-[1.45] text-hi" style={{ fontFamily: handFont(content.message) }}>
              <TypeOut text={content.message} speed={auto ? 22 : 38} />
            </p>
            <p className="mt-5 text-right font-display text-[22px] italic text-[var(--glow)]">— {content.senderName}</p>
          </div>
        </div>
      ),
    },
    {
      id: "heart",
      reelMs: 3000,
      render: ({ next, auto }) => (
        <div ref={burst} className="relative flex h-full flex-col items-center justify-center gap-6">
          <FloatingHearts />
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.8 }}
            onAnimationComplete={() => auto && heartBurst(burst.current, 18)}
            onClick={() => {
              haptic([10, 30, 20]);
              sound.chime(784, 1);
              heartBurst(burst.current, 18);
              setTimeout(next, 900);
            }}
            className="grid h-36 w-36 place-items-center rounded-full text-[76px] [background:radial-gradient(closest-side,rgba(255,77,126,.45),transparent)]"
            aria-label={t("tapTheHeart")}
          >
            <span className="drop-shadow-[0_0_24px_rgba(255,77,126,0.9)]">♥</span>
          </motion.button>
          <p className="text-[15px] font-medium text-mid">{t("tapTheHeart")}</p>
        </div>
      ),
    },
    { id: "reply", reelMs: 4000, render: () => <ReplyCard ctx={ctx} mode={mode} /> },
  ];
  return (
    <>
      <GiftShell glow="rose" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="night"
        background={<><div className="absolute inset-0 [background:var(--grad-aurora)]" /><Starfield density={0.8} /></>} />
      {ctx.isFree && (
        <div className="pointer-events-none absolute left-3 top-[max(12px,env(safe-area-inset-top))] z-30 rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur-md">
          {t("freeBadge", { brand: BRAND.name })}
        </div>
      )}
    </>
  );
}
