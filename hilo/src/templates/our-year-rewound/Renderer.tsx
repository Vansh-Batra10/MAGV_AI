"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene } from "@/engines/shell/GiftShell";
import { Stories, CountUp, KenBurns, type StorySlide } from "@/engines/stories/Stories";
import { ReplyCard, SongCard, confetti, handFont } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { sound } from "@/lib/client/sound";

const ACCENTS = ["#FF4D7E", "#FFC870", "#C9B6FF", "#FF8A65", "#FF7A9C"];

function Fireworks({ auto }: { auto: boolean }) {
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      void confetti({ particleCount: 70, spread: 360, origin: { x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.3 }, colors: ["#FF4D7E", "#FFC870", "#C9B6FF", "#FFF8EF"] });
      if (!auto) sound.chime(1200 + Math.random() * 600, 0.5, 0.04);
      if (++n > 5) clearInterval(id);
    }, 650);
    return () => clearInterval(id);
  }, [auto]);
  return null;
}

export default function OurYearRewound({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const slides: StorySlide[] = [
    {
      id: "title",
      ms: 4200,
      render: () => (
        <div className="flex h-full flex-col justify-center px-8" style={{ background: "radial-gradient(90% 60% at 30% 30%, rgba(255,77,126,0.35), transparent 70%), #0b0714" }}>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="eyebrow !text-[12px]">{t("year.rewound")}</motion.p>
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }} className="font-display text-[150px] leading-[0.85] tracking-tighter text-kiss">{c.year}</motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-4 font-display text-[44px] italic leading-none text-hi">{t("year.us", { a: c.senderName, b: c.recipientName })}</motion.p>
        </div>
      ),
    },
    ...c.stats.map((s, k): StorySlide => ({
      id: `stat${k}`,
      ms: 3800,
      render: () => (
        <div className="flex h-full flex-col justify-center px-8" style={{ background: `radial-gradient(80% 55% at 70% 40%, ${ACCENTS[k % 5]}40, transparent 70%), #0b0714` }}>
          <p className="eyebrow !text-[12px]">{t("year.statOf", { n: k + 1, total: c.stats.length })}</p>
          <p className="mt-4 font-display leading-[0.9] tracking-tight text-hi" style={{ fontSize: String(s.value).length > 5 ? 96 : 132, textShadow: `0 0 40px ${ACCENTS[k % 5]}88` }}>
            <CountUp to={s.value} />
            {s.suffix && <span className="ml-2 text-[40px] italic" style={{ color: ACCENTS[k % 5] }}>{s.suffix}</span>}
          </p>
          <p className="mt-4 max-w-[300px] font-display text-[34px] italic leading-tight text-mid">{s.label}</p>
        </div>
      ),
    })),
    ...(c.mostSaidWord
      ? [{
          id: "word",
          ms: 3800,
          render: () => (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center" style={{ background: "radial-gradient(70% 50% at 50% 50%, rgba(201,182,255,0.3), transparent 70%), #0b0714" }}>
              <p className="eyebrow !text-[12px]">{t("year.mostSaid")}</p>
              <motion.p initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.3 }} className="mt-6 font-display text-[64px] italic leading-none text-hi" style={{ fontFamily: handFont(c.mostSaidWord) }}>{c.mostSaidWord}</motion.p>
            </div>
          ),
        } satisfies StorySlide]
      : []),
    {
      id: "top5",
      ms: 2600,
      render: () => (
        <div className="flex h-full flex-col justify-center px-8" style={{ background: "radial-gradient(80% 60% at 50% 60%, rgba(255,200,112,0.25), transparent 70%), #0b0714" }}>
          <p className="font-display text-[64px] leading-none text-hi">{t("year.top")}</p>
          <p className="font-display text-[64px] italic leading-none text-amber-300">{t("year.memories")}</p>
        </div>
      ),
    },
    ...c.memories.map((m, k): StorySlide => ({
      id: `mem${k}`,
      ms: 4200,
      render: () => (
        <div className="relative h-full">
          <KenBurns src={m.photo} i={k} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
          <div className="absolute bottom-[18%] left-7 right-7">
            <p className="font-display text-[88px] leading-none text-white/90">#{k + 1}</p>
            <p className="mt-2 font-display text-[32px] italic leading-tight text-white">{m.caption}</p>
          </div>
        </div>
      ),
    })),
    ...(c.song?.url || c.song?.title
      ? [{
          id: "song",
          ms: 6000,
          render: () => (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-8" style={{ background: "radial-gradient(70% 50% at 50% 40%, rgba(255,77,126,0.3), transparent 70%), #0b0714" }}>
              <p className="font-display text-[48px] leading-none text-hi">{t("year.songOfYear")}</p>
              {c.song?.url ? <div className="relative z-20"><SongCard url={c.song.url} title={c.song.title} mode={mode} /></div> : <p className="font-display text-[34px] italic text-rose-400">{c.song?.title}</p>}
            </div>
          ),
        } satisfies StorySlide]
      : []),
    {
      id: "promises",
      ms: 6500,
      render: () => (
        <div className="flex h-full flex-col justify-center px-8" style={{ background: "radial-gradient(80% 60% at 50% 30%, rgba(201,182,255,0.28), transparent 70%), #0b0714" }}>
          <p className="font-display text-[54px] leading-none text-hi">{c.year + 1}</p>
          <p className="font-display text-[40px] italic leading-none text-lavender-300">{t("year.promises")}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {c.promises.map((p, k) => (
              <motion.li key={k} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + k * 0.5 }} className="flex items-start gap-3 text-[20px] leading-snug text-hi">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + k * 0.5, type: "spring" }} className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-500 text-[14px] font-bold text-white shadow-[0_0_14px_#ff4d7e]">✓</motion.span>
                <span style={{ fontFamily: handFont(p) }}>{p}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  const scenes: Scene[] = [
    { id: "stories", reelMs: 999999, render: (api) => <Stories slides={slides} api={api} /> },
    {
      id: "finale",
      reelMs: 5500,
      render: ({ auto }) => (
        <ReplyCard ctx={ctx} mode={mode}>
          <Fireworks auto={auto} />
          <div className="text-center">
            <p className="font-display text-[48px] leading-none text-hi glow-text">{t("year.happyNewYear")}</p>
            <p className="mx-auto mt-3 max-w-[300px] text-[18px] text-mid" style={{ fontFamily: handFont(c.closing) }}>{c.closing}</p>
          </div>
        </ReplyCard>
      ),
    },
  ];
  return (
    <GiftShell glow="rose" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="festive" hideDots
      background={<><div className="absolute inset-0 [background:var(--grad-aurora)]" /><Starfield density={0.6} /></>} />
  );
}
