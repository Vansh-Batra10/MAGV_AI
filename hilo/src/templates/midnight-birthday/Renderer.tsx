"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene, type SceneApi } from "@/engines/shell/GiftShell";
import { LetterCard, ReplyCard, SongCard, VoicePlayer, confetti, TypeOut } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { Cake, Candle, Polaroid } from "@/components/art";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";

function Candles({ c, api, n }: { c: Content; api: SceneApi; n: number }) {
  const t = useTranslations("gift");
  const [lit, setLit] = useState<boolean[]>(Array(n).fill(false));
  const [phase, setPhase] = useState<"light" | "blow" | "out">("light");
  const [micState, setMicState] = useState<"idle" | "listening" | "failed">("idle");
  const [level, setLevel] = useState(0);
  const stopMic = useRef<() => void>(() => {});
  const allLit = lit.every(Boolean);

  const light = (k: number) => {
    if (lit[k] || phase !== "light") return;
    haptic(8);
    sound.chime(523 + k * 90, 0.7, 0.08);
    setLit((l) => l.map((x, i) => (i === k ? true : x)));
  };
  useEffect(() => {
    if (allLit && phase === "light") {
      const id = setTimeout(() => setPhase("blow"), 700);
      return () => clearTimeout(id);
    }
  }, [allLit, phase]);
  // autoplay
  useEffect(() => {
    if (!api.auto) return;
    if (phase === "light") {
      const k = lit.findIndex((x) => !x);
      if (k >= 0) {
        const id = setTimeout(() => light(k), 380 / api.speed);
        return () => clearTimeout(id);
      }
    }
    if (phase === "blow") {
      const id = setTimeout(blow, 1300 / api.speed);
      return () => clearTimeout(id);
    }
  });
  useEffect(() => () => stopMic.current(), []);

  const blow = () => {
    if (phase === "out") return;
    stopMic.current();
    haptic([20, 40, 60]);
    sound.whoosh();
    setPhase("out");
    setTimeout(() => {
      void confetti({ particleCount: 160, spread: 100 });
      sound.bells();
    }, 500);
    setTimeout(api.next, api.auto ? 1800 / api.speed : 2600);
  };

  const listen = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let loud = 0, raf = 0;
      const loop = () => {
        an.getFloatTimeDomainData(buf);
        let s = 0;
        for (const v of buf) s += v * v;
        const rms = Math.sqrt(s / buf.length);
        setLevel(Math.min(1, rms * 6));
        loud = rms > 0.12 ? loud + 1 : Math.max(0, loud - 1);
        if (loud > 12) return blow();
        raf = requestAnimationFrame(loop);
      };
      stopMic.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ac.close();
      };
      setMicState("listening");
      loop();
    } catch {
      setMicState("failed");
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
      <AnimatePresence mode="wait">
        <motion.p key={phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center font-display text-[34px] leading-tight text-hi glow-text">
          {phase === "light" ? t("bday.lightThem") : phase === "blow" ? t("bday.makeAWish") : t.rich("bday.hbd", { name: c.recipientName, em: (x) => <em className="text-amber-300">{x}</em> })}
        </motion.p>
      </AnimatePresence>
      <div className="relative flex items-end justify-center gap-3" style={{ height: 150 }}>
        {lit.map((l, k) => (
          <button key={k} type="button" onClick={() => light(k)} aria-label={t("bday.candle", { n: k + 1 })} className="relative">
            <Candle size={44} lit={l && phase !== "out"} style={{ height: 110 + (k % 2) * 16 }} />
            {phase === "out" && (
              <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
                {[0, 1, 2].map((s) => (
                  <motion.span key={s} className="absolute block h-5 w-5 rounded-full bg-white/30 blur-[4px]" initial={{ y: 0, opacity: 0.8, scale: 0.4 }} animate={{ y: -120 - s * 30, x: (s - 1) * 14, opacity: 0, scale: 2.2 }} transition={{ duration: 2.2, delay: s * 0.2 }} />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="min-h-[96px] text-center">
        {phase === "light" && <p className="text-[15px] text-mid">{t("bday.tapCandles")}</p>}
        {phase === "blow" && (
          <div className="flex flex-col items-center gap-3">
            {micState === "listening" ? (
              <>
                <p className="text-[15px] text-hi">{t("bday.blowNow")}</p>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300 transition-[width] duration-75" style={{ width: `${level * 100}%` }} /></div>
              </>
            ) : (
              !api.auto && (
                <button type="button" onClick={listen} className="h-12 rounded-full px-6 font-semibold text-ink-950 [background:var(--grad-kiss)]">
                  {t("bday.blowMic")}
                </button>
              )
            )}
            <button type="button" onClick={blow} className="text-[14px] text-mid underline underline-offset-4">
              {micState === "failed" ? t("bday.micFailed") : t("bday.tapToBlow")}
            </button>
          </div>
        )}
        {phase === "out" && c.age ? <p className="font-display text-[22px] italic text-amber-300">{t("bday.age", { n: Number(c.age) })}</p> : null}
      </div>
    </div>
  );
}

function Carousel({ c, api }: { c: Content; api: SceneApi }) {
  const t = useTranslations("gift");
  const [k, setK] = useState(0);
  const n = c.photos.length;
  useEffect(() => {
    if (!api.auto) return;
    const id = setInterval(() => setK((x) => (x + 1) % n), 1500 / api.speed);
    return () => clearInterval(id);
  }, [api.auto, n, api.speed]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="relative h-[460px] w-full">
        {c.photos.map((p, i) => {
          const off = i - k;
          return (
            <motion.div key={i} className="absolute left-1/2 top-0 w-[68%]" drag={off === 0 && !api.auto ? "x" : false} dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setK((x) => Math.min(n - 1, x + 1));
                else if (info.offset.x > 60) setK((x) => Math.max(0, x - 1));
              }}
              animate={{ x: `calc(-50% + ${off * 78}%)`, rotate: off * 6 + (i % 2 ? 2 : -2), scale: off === 0 ? 1 : 0.86, opacity: Math.abs(off) > 1 ? 0 : off === 0 ? 1 : 0.55, zIndex: 10 - Math.abs(off) }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}>
              <Polaroid src={p} caption={c.captions[i]} />
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setK((x) => Math.max(0, x - 1))} className="h-11 w-11 rounded-full bg-white/10 text-hi" aria-label="previous">‹</button>
        <span className="text-[13px] tabular-nums text-mid">{k + 1} / {n}</span>
        {k < n - 1 ? (
          <button type="button" onClick={() => setK((x) => x + 1)} className="h-11 w-11 rounded-full bg-white/10 text-hi" aria-label="next">›</button>
        ) : (
          <button type="button" onClick={api.next} className="h-11 rounded-full bg-white/15 px-5 text-[14px] font-semibold text-hi">{t("continue")}</button>
        )}
      </div>
    </div>
  );
}

export default function MidnightBirthday({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const nCandles = Math.max(3, Math.min(7, Number(c.age) || 5));
  const scenes: Scene[] = [
    {
      id: "midnight",
      reelMs: 2800,
      tapToContinue: true,
      render: ({ auto }) => (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-mono text-[64px] tabular-nums text-amber-300 glow-text">00:00</p>
          <p className="font-display text-[30px] italic leading-snug text-hi"><TypeOut text={t("bday.midnight", { name: c.recipientName })} speed={auto ? 30 : 45} /></p>
        </div>
      ),
    },
    { id: "candles", reelMs: 9000, render: (api) => <Candles c={c} api={api} n={nCandles} /> },
    ...(c.photos.length ? [{ id: "photos", reelMs: 1500 * Math.max(2, c.photos.length) + 600, render: (api: SceneApi) => <Carousel c={c} api={api} /> }] : []),
    {
      id: "letter",
      reelMs: 8500,
      tapToContinue: true,
      render: ({ auto }) => (
        <div className="flex h-full flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-16">
          <LetterCard text={c.letter} from={c.senderName} auto={auto} />
          {c.voiceUrl && <div className="mt-6 w-full max-w-[330px]"><VoicePlayer src={c.voiceUrl} label={t("playVoice")} /></div>}
          {c.song?.url && <SongCard url={c.song.url} title={c.song.title} mode={mode} />}
        </div>
      ),
    },
    {
      id: "reply",
      reelMs: 5000,
      render: () => (
        <ReplyCard ctx={ctx} mode={mode}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9 }} className="flex flex-col items-center">
            <Cake size={220} name={c.recipientName} />
            <p className="mt-1 max-w-[300px] text-center font-display text-[22px] italic text-amber-300">{c.wish}</p>
          </motion.div>
        </ReplyCard>
      ),
    },
  ];
  return (
    <GiftShell glow="amber" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="warm"
      background={<><div className="absolute inset-0" style={{ background: "radial-gradient(70% 45% at 50% 60%, rgba(255,200,112,0.16), transparent 70%), radial-gradient(130% 90% at 50% 100%, #1a0f2e, #0b0714 70%)" }} /><Starfield density={0.6} shooting={false} /></>} />
  );
}
