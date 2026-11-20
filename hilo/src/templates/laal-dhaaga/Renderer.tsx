"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene } from "@/engines/shell/GiftShell";
import { LetterCard, ReplyCard, SongCard, VoicePlayer, TypeOut } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { Moon } from "@/components/art";
import { distanceKm, timeIn } from "@/data/cities";

type C = { lat: number; lon: number };
const rad = Math.PI / 180;

function toVec({ lat, lon }: C) {
  return [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];
}
function fromVec([x, y, z]: number[]): C {
  return { lat: Math.asin(Math.max(-1, Math.min(1, z))) / rad, lon: Math.atan2(y, x) / rad };
}
function slerp(a: C, b: C, t: number): C {
  const A = toVec(a), B = toVec(b);
  const d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
  if (d < 1e-6) return a;
  const s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
  return fromVec([A[0] * s1 + B[0] * s2, A[1] * s1 + B[1] * s2, A[2] * s1 + B[2] * s2]);
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function CountUp({ to, ms = 1800, format = (n: number) => n.toLocaleString("en-IN") }: { to: number; ms?: number; format?: (n: number) => string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{format(v)}</>;
}

export function NightGlobe({ a, b, size = 330, drawMs = 2600, labels }: { a: C; b: C; size?: number; drawMs?: number; labels?: [string, string] }) {
  const R = size / 2 - 8;
  const mid = slerp(a, b, 0.5);
  const lat0 = mid.lat * rad, lon0 = mid.lon * rad;
  const project = (p: C, lift = 1) => {
    const la = p.lat * rad, lo = p.lon * rad;
    const x = Math.cos(la) * Math.sin(lo - lon0);
    const y = Math.cos(lat0) * Math.sin(la) - Math.sin(lat0) * Math.cos(la) * Math.cos(lo - lon0);
    const vis = Math.sin(lat0) * Math.sin(la) + Math.cos(lat0) * Math.cos(la) * Math.cos(lo - lon0);
    return { x: size / 2 + x * R * lift, y: size / 2 - y * R * lift, vis };
  };
  const arc = useMemo(() => {
    const raw = Array.from({ length: 49 }, (_, i) => project(slerp(a, b, i / 48)));
    const s0 = raw[0], s1 = raw[48];
    const dx = s1.x - s0.x, dy = s1.y - s0.y, len = Math.hypot(dx, dy) || 1;
    // bow the thread "up" off the globe (perpendicular, towards the top of the screen)
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const h = Math.min(90, len * 0.35);
    const pts = raw.map((p, i) => {
      const k = Math.sin((Math.PI * i) / 48) * h;
      return { x: p.x + nx * k, y: p.y + ny * k };
    });
    return "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.lat, a.lon, b.lat, b.lon, size]);
  const graticule = useMemo(() => {
    const lines: string[] = [];
    for (let lon = -180; lon < 180; lon += 20) {
      const seg: string[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const p = project({ lat, lon });
        seg.push(p.vis > 0 ? `${seg.length && seg[seg.length - 1] !== "|" ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}` : "|");
      }
      lines.push(seg.filter((s) => s !== "|").join(" "));
    }
    for (let lat = -60; lat <= 60; lat += 20) {
      const seg: string[] = [];
      let pen = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = project({ lat, lon });
        if (p.vis > 0) {
          seg.push(`${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
          pen = true;
        } else pen = false;
      }
      lines.push(seg.join(" "));
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.lat, a.lon, b.lat, b.lon, size]);
  const pa = project(a), pb = project(b);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="globeFill" cx="38%" cy="32%"><stop offset="0" stopColor="#3b1f5c" /><stop offset="0.7" stopColor="#1a0f2e" /><stop offset="1" stopColor="#0b0714" /></radialGradient>
        <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={R + 18} fill="#c9b6ff" opacity="0.08" style={{ filter: "blur(14px)" }} />
      <circle cx={size / 2} cy={size / 2} r={R} fill="url(#globeFill)" stroke="#c9b6ff" strokeOpacity="0.35" />
      {graticule.map((d, i) => <path key={i} d={d} fill="none" stroke="#c9b6ff" strokeOpacity="0.13" strokeWidth="0.8" />)}
      <path d={arc} fill="none" stroke="#ff4d7e" strokeWidth="2.4" strokeLinecap="round" filter="url(#tglow)" pathLength={1} strokeDasharray="1" strokeDashoffset="1" style={{ animation: `draw ${drawMs}ms var(--ease-expo) 0.4s forwards` }} />
      {[pa, pb].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="10" fill="#ff4d7e" opacity="0.25" style={{ animation: "pulse-glow 2s infinite" }} />
          <circle cx={p.x} cy={p.y} r="4" fill="#ffe4ec" />
          {labels && <text x={p.x} y={p.y + 24} textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="1.5" fill="rgba(255,245,248,0.8)">{labels[i].toUpperCase()}</text>}
        </g>
      ))}
    </svg>
  );
}

export default function LaalDhaaga({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const now = useNow();
  const km = distanceKm(c.yourCity, c.theirCity);
  const units = ctx.units ?? "km";
  const dist = units === "mi" ? Math.round(km * 0.621371) : km;

  const scenes: Scene[] = [
    {
      id: "clocks",
      reelMs: 4600,
      tapToContinue: true,
      render: () => (
        <div className="flex h-full flex-col">
          {[c.yourCity, c.theirCity].map((city, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: i ? 40 : -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: i * 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col items-center justify-center gap-1">
              <p className="eyebrow !text-[11px]">{i ? t("ld.theirs", { name: c.nickname || c.recipientName }) : t("ld.yours")}</p>
              <p className="font-display text-[44px] leading-none text-hi">{city.name}</p>
              <p className="font-mono text-[34px] tabular-nums text-[var(--glow)] glow-text">{timeIn(city.tz, now)}</p>
            </motion.div>
          ))}
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <div className="h-px w-56 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#ff4d7e]" />
            <p className="mt-3 rounded-full bg-black/40 px-4 py-1.5 text-[14px] font-semibold text-hi backdrop-blur-md">
              <CountUp to={dist} /> {units} {t("ld.apart")}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "thread",
      reelMs: 5200,
      tapToContinue: true,
      render: ({ auto }) => (
        <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
          <NightGlobe a={c.yourCity} b={c.theirCity} drawMs={auto ? 2000 : 2600} labels={[c.yourCity.name, c.theirCity.name]} />
          <p className="text-center font-display text-[28px] italic leading-snug text-hi">
            <TypeOut text={c.threadLine} speed={auto ? 24 : 40} />
          </p>
        </div>
      ),
    },
    ...(c.photos.length
      ? [{
          id: "lanterns",
          reelMs: 6500,
          tapToContinue: true,
          render: () => (
            <div className="relative h-full overflow-hidden">
              {c.photos.map((p, i) => {
                const left = [8, 52, 22, 60, 12, 46, 30, 64][i % 8];
                return (
                  <motion.div key={i} className="absolute w-[38%]" style={{ left: `${left}%` }}
                    initial={{ y: 700, opacity: 0 }} animate={{ y: [700, -340], opacity: [0, 1, 1, 0.9] }}
                    transition={{ duration: 8, delay: i * 0.7 - 1.5, ease: "linear", repeat: Infinity, repeatDelay: Math.max(0, c.photos.length * 0.9 - 9) }}>
                    <div className="rounded-[18px] bg-gradient-to-b from-[#ffc870] to-[#ff8a65] p-[3px] shadow-[0_0_40px_-4px_rgba(255,200,112,0.7)]">
                      <img src={p} alt="" className="aspect-[4/5] w-full rounded-[15px] object-cover" draggable={false} />
                    </div>
                    {c.captions[i] && <p className="mt-2 text-center font-hand text-[15px] text-amber-300/90">{c.captions[i]}</p>}
                  </motion.div>
                );
              })}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
            </div>
          ),
        } satisfies Scene]
      : []),
    {
      id: "letter",
      reelMs: 9000,
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
      id: "moon",
      reelMs: 5000,
      tapToContinue: true,
      render: () => (
        <div className="relative flex h-full flex-col">
          {[c.theirCity, c.yourCity].map((city, i) => (
            <div key={i} className={`relative flex flex-1 items-center justify-center ${i ? "border-t border-white/10" : ""}`}>
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, delay: 0.3 + i * 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Moon size={140} />
              </motion.div>
              <p className="absolute bottom-5 left-0 right-0 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-mid">{city.name} · {timeIn(city.tz, now)}</p>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-ink-950/70 px-6 py-3 font-display text-[30px] italic text-hi backdrop-blur-md glow-text">{c.finale}</p>
          </div>
        </div>
      ),
    },
    { id: "reply", reelMs: 4000, render: () => <ReplyCard ctx={ctx} mode={mode} /> },
  ];

  return (
    <GiftShell glow="lavender" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="night"
      background={<><div className="absolute inset-0" style={{ background: "radial-gradient(100% 60% at 50% 0%, rgba(201,182,255,0.18), transparent 60%), radial-gradient(120% 80% at 50% 100%, #1a0f2e, #0b0714 70%)" }} /><Starfield density={1.1} /></>} />
  );
}
