"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { Contribution, RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene } from "@/engines/shell/GiftShell";
import { Corkboard, HeartMosaic, Credits } from "@/engines/group-wall/GroupWall";
import { ReplyCard, handFont, confetti } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";

export default function SabKiTarafSe({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const organiser: Contribution | null = c.organiserNote ? { id: "org", name: c.senderName, message: c.organiserNote, photoUrl: null, voiceUrl: null } : null;
  const others = ctx.contributions ?? c.sample ?? [];
  const items = [...(organiser ? [organiser] : []), ...others];
  const n = items.length;
  const names = Array.from(new Set(items.map((i) => i.name)));

  const scenes: Scene[] = [
    {
      id: "title",
      reelMs: 3400,
      tapToContinue: true,
      render: () => (
        <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
          {c.coverPhoto && (
            <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ duration: 1 }} className="w-[58%] rounded-[3px] bg-cream-50 p-2 pb-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
              <img src={c.coverPhoto} alt="" className="aspect-square w-full object-cover" />
            </motion.div>
          )}
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="font-display text-[40px] leading-[1.05] text-hi glow-text">
            {(c.headline || t("group.defaultHeadline")).replace("{n}", String(n))}
          </motion.p>
          <p className="text-[15px] text-mid">{t(`group.variant.${c.variant}`, { name: c.recipientName })}</p>
        </div>
      ),
    },
    { id: "board", reelMs: 9000, render: (api) => <Corkboard items={items} api={api} /> },
    {
      id: "mosaic",
      reelMs: 4500,
      tapToContinue: true,
      render: () => (
        <div className="flex h-full flex-col items-center justify-center gap-8">
          <HeartMosaic items={items} fallbackPhotos={c.coverPhoto ? [c.coverPhoto] : []} />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} onAnimationComplete={() => void confetti({ particleCount: 90 })} className="font-display text-[40px] italic text-hi glow-text">
            {c.creditsTitle || t("group.fromAll")}
          </motion.p>
        </div>
      ),
    },
    {
      id: "credits",
      reelMs: Math.max(6000, names.length * 550),
      tapToContinue: true,
      render: ({ auto }) => <Credits names={names} title={c.creditsTitle || t("group.fromAll")} auto={auto} />,
    },
    { id: "reply", reelMs: 4000, render: () => <ReplyCard ctx={ctx} mode={mode} title={t("group.replyTitle")} /> },
  ];
  return (
    <GiftShell glow="rose" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="warm"
      background={<><div className="absolute inset-0" style={{ background: "radial-gradient(90% 50% at 50% 0%, rgba(255,77,126,0.18), transparent 70%), radial-gradient(130% 90% at 50% 100%, #1a0f2e, #0b0714 70%)" }} /><Starfield density={0.9} /></>} />
  );
}
// handFont re-export keeps tree-shaking happy for the corkboard
export { handFont };
