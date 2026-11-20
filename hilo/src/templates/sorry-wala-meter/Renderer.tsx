"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene, type SceneApi } from "@/engines/shell/GiftShell";
import { ReplyCard, confetti, TypeOut, handFont } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { Polaroid } from "@/components/art";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";

function Gauge({ value, label }: { value: number; label: string }) {
  const angle = -90 + (value / 100) * 180;
  const color = value > 66 ? "#FF4D7E" : value > 33 ? "#FF8A65" : "#FFC870";
  return (
    <div className="relative mx-auto w-[280px]">
      <svg viewBox="0 0 200 116" className="w-full overflow-visible">
        <defs>
          <linearGradient id="gaugeG" x1="0" x2="1"><stop offset="0" stopColor="#FFC870" /><stop offset="0.5" stopColor="#FF8A65" /><stop offset="1" stopColor="#FF4D7E" /></linearGradient>
        </defs>
        <path d="M14 104 A86 86 0 0 1 186 104" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
        <path d="M14 104 A86 86 0 0 1 186 104" fill="none" stroke="url(#gaugeG)" strokeWidth="16" strokeLinecap="round" pathLength={100} strokeDasharray="100" style={{ strokeDashoffset: 100 - value, transition: "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)", filter: `drop-shadow(0 0 8px ${color})` }} />
        {Array.from({ length: 11 }, (_, k) => {
          const a = (Math.PI * k) / 10;
          return <line key={k} x1={100 - Math.cos(a) * 66} y1={104 - Math.sin(a) * 66} x2={100 - Math.cos(a) * 72} y2={104 - Math.sin(a) * 72} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />;
        })}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 104px", transition: "transform 1.4s cubic-bezier(.34,1.56,.64,1)" }}>
          <line x1="100" y1="104" x2="100" y2="34" stroke="#FFF5F8" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="104" r="8" fill="#FFF5F8" />
      </svg>
      <div className="mt-1 text-center">
        <p className="font-display text-[54px] leading-none tabular-nums text-hi" style={{ textShadow: `0 0 26px ${color}` }}>{Math.round(value)}%</p>
        <p className="eyebrow mt-1 !text-[11px]">{label}</p>
      </div>
    </div>
  );
}

function MeterScene({ value, children, api }: { value: number; children: React.ReactNode; api: SceneApi }) {
  const t = useTranslations("gift");
  const [v, setV] = useState(Math.min(100, value + 25));
  useEffect(() => {
    const id = setTimeout(() => {
      setV(value);
      haptic(15);
      sound.chime(440 + (100 - value) * 6, 0.6, 0.07);
    }, api.auto ? 600 : 1100);
    return () => clearTimeout(id);
  }, [value, api.auto]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-7 pt-10">
      <Gauge value={v} label={t("sorry.meter")} />
      <div className="w-full">{children}</div>
    </div>
  );
}

function AutoAnswer({ ms, fn }: { ms: number; fn: () => void }) {
  useEffect(() => {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function SorryMeter({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const [answer, setAnswer] = useState<null | "yes" | "later">(null);
  const [extra, setExtra] = useState(false);

  const answerWith = async (a: "yes" | "later") => {
    setAnswer(a);
    if (a === "yes") {
      haptic([20, 40, 20]);
      void confetti({ colors: ["#FF4D7E", "#FFC870", "#FFF8EF"] });
      sound.bells();
    }
    if (mode === "live" && ctx.sendReply) await ctx.sendReply({ kind: "answer", text: a === "yes" ? "forgiven" : "talk_later" });
  };

  const line = (text: string, auto: boolean) => (
    <p className="glass-strong p-6 text-center text-[21px] leading-[1.5] text-hi" style={{ fontFamily: handFont(text) }}>
      <TypeOut text={text} speed={auto ? 22 : 34} />
    </p>
  );

  const scenes: Scene[] = [
    { id: "start", reelMs: 2600, tapToContinue: true, render: (api) => <MeterScene value={100} api={api}><p className="text-center font-display text-[30px] italic text-hi">{t("sorry.intro", { name: c.recipientName })}</p></MeterScene> },
    { id: "apology", reelMs: 5200, tapToContinue: true, render: (api) => <MeterScene value={75} api={api}>{line(c.apology, api.auto)}</MeterScene> },
    ...(c.memoryPhoto
      ? [{ id: "memory", reelMs: 4800, tapToContinue: true, render: (api: SceneApi) => (
          <MeterScene value={50} api={api}>
            <div className="flex items-center gap-4">
              <Polaroid src={c.memoryPhoto} rotate={-5} className="w-[44%] shrink-0" />
              <p className="text-[17px] leading-snug text-hi" style={{ fontFamily: handFont(c.memoryCaption) }}>{c.memoryCaption}</p>
            </div>
          </MeterScene>
        ) } satisfies Scene]
      : []),
    { id: "promise", reelMs: 4600, tapToContinue: true, render: (api) => <MeterScene value={25} api={api}>{line(c.promise, api.auto)}</MeterScene> },
    ...(c.bribe
      ? [{ id: "bribe", reelMs: 4000, tapToContinue: true, render: (api: SceneApi) => (
          <MeterScene value={8} api={api}>
            <div className="paper mx-auto w-[86%] rotate-[-2deg] rounded-md p-5 text-center shadow-2xl">
              <p className="eyebrow !text-[10px] !text-[#a8123f]">{t("sorry.coupon")}</p>
              <p className="mt-2 font-hand text-[24px] leading-tight">{c.bribe}</p>
              <p className="mt-2 text-[11px] uppercase tracking-widest text-[#8a6a5a]">{t("sorry.noExpiry")}</p>
            </div>
          </MeterScene>
        ) } satisfies Scene]
      : []),
    {
      id: "ask",
      reelMs: 5000,
      render: (api) => {
        if (answer) {
          return (
            <ReplyCard ctx={ctx} mode={mode} title={answer === "yes" ? t("sorry.thankYou") : t("sorry.okayLater")}>
              <Gauge value={answer === "yes" ? 0 : 40} label={t("sorry.meter")} />
            </ReplyCard>
          );
        }
        return (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-7">
            {api.auto && <AutoAnswer ms={2500 / api.speed} fn={() => setAnswer("yes")} />}
            <Gauge value={extra ? 2 : 8} label={t("sorry.meter")} />
            {extra && <p className="glass-strong p-5 text-center text-[19px] leading-snug text-hi" style={{ fontFamily: handFont(c.extraScene) }}>{c.extraScene}</p>}
            <p className="font-display text-[44px] italic text-hi glow-text">{t("sorry.forgiven")}</p>
            <div className="flex w-full flex-col gap-3">
              <button type="button" onClick={() => answerWith("yes")} className="h-14 rounded-full text-[17px] font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.7)]">{t("sorry.yes")}</button>
              {!extra && <button type="button" onClick={() => { setExtra(true); sound.chime(660, 0.6); }} className="h-14 rounded-full bg-white/10 text-[16px] font-semibold text-hi">{t("sorry.tryHarder")}</button>}
              <button type="button" onClick={() => answerWith("later")} className="h-12 rounded-full text-[15px] text-mid underline-offset-4 hover:underline">{t("sorry.later")}</button>
            </div>
          </div>
        );
      },
    },
  ];
  return (
    <GiftShell glow="rose" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="night"
      background={<><div className="absolute inset-0 [background:var(--grad-aurora)]" /><Starfield density={0.7} /></>} />
  );
}
