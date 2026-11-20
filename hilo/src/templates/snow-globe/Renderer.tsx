"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { RendererProps } from "../types";
import type { Content } from "./def";
import { GiftShell, type Scene, type SceneApi } from "@/engines/shell/GiftShell";
import { ReplyCard, SongCard, TypeOut, handFont } from "@/engines/shell/blocks";
import { Starfield } from "@/components/ui/Starfield";
import { Ornament } from "@/components/art";
import Globe2D from "./Globe2D";
import { usePerf } from "@/lib/client/perf";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";

const Globe3D = dynamic(() => import("./Globe3D"), { ssr: false, loading: () => null });

class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function GlobeScene({ c, api }: { c: Content; api: SceneApi }) {
  const t = useTranslations("gift");
  const perf = usePerf();
  const [shake, setShake] = useState(0);
  const [use3d, setUse3d] = useState(false);
  const [motionState, setMotionState] = useState<"unknown" | "on" | "denied">("unknown");
  useEffect(() => {
    setUse3d(api.mode !== "thumbnail" && !perf.lowEnd && !perf.reduced && hasWebGL());
  }, [perf.lowEnd, perf.reduced, api.mode]);
  useEffect(() => {
    if (!api.auto) return;
    const id = setInterval(() => setShake((s) => s + 1), 2200 / api.speed);
    return () => clearInterval(id);
  }, [api.auto, api.speed]);
  useEffect(() => {
    if (motionState !== "on") return;
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const m = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      if (m > 30 && Date.now() - last > 500) {
        last = Date.now();
        setShake((s) => s + 1);
        haptic(20);
        sound.chime(1318, 0.6, 0.05);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [motionState]);
  const enableMotion = async () => {
    const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    try {
      if (DM?.requestPermission) setMotionState((await DM.requestPermission()) === "granted" ? "on" : "denied");
      else setMotionState("on");
    } catch {
      setMotionState("denied");
    }
  };
  const tapShake = () => {
    setShake((s) => s + 1);
    haptic(15);
    sound.chime(1568, 0.5, 0.05);
  };
  const flat = <Globe2D photo={c.photo} shake={shake} size={300} />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <p className="text-center font-display text-[32px] leading-tight text-hi glow-text">{t.rich("snow.title", { name: c.recipientName, em: (x) => <em className="text-amber-300">{x}</em> })}</p>
      <button type="button" onClick={tapShake} aria-label={t("snow.tapShake")} className="relative">
        {use3d ? <Fallback fallback={flat}><Globe3D photo={c.photo} shake={shake} size={310} /></Fallback> : flat}
      </button>
      {!api.auto && (
        <div className="flex flex-col items-center gap-2">
          {motionState === "unknown" && perf.touch ? (
            <button type="button" onClick={enableMotion} className="h-12 rounded-full bg-white/10 px-6 font-semibold text-hi">{t("snow.shakePhone")}</button>
          ) : (
            <p className="text-[15px] text-mid">{motionState === "on" ? t("snow.shakeNow") : t("snow.tapShake")}</p>
          )}
          <button type="button" onClick={api.next} className="h-11 rounded-full px-5 text-[14px] font-semibold text-amber-300">{t("snow.openOrnaments")} →</button>
        </div>
      )}
    </div>
  );
}

function Ornaments({ c, api }: { c: Content; api: SceneApi }) {
  const t = useTranslations("gift");
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const colors = ["#FF4D7E", "#FFC870", "#C9B6FF", "#FF8A65", "#7ad0b0"];
  useEffect(() => {
    if (!api.auto) return;
    let k = 0;
    const id = setInterval(() => {
      if (k < c.ornaments.length) setOpen(k++);
      else setOpen(null);
    }, 2300 / api.speed);
    return () => clearInterval(id);
  }, [api.auto, c.ornaments.length, api.speed]);
  const tap = (k: number) => {
    haptic(12);
    sound.chime(880 + k * 120, 0.9, 0.08);
    setOpen(k);
    setSeen((s) => new Set(s).add(k));
  };
  return (
    <div className="relative flex h-full flex-col items-center px-6 pt-16">
      <div className="flex w-full justify-around">
        {c.ornaments.map((o, k) => (
          <motion.button key={k} type="button" onClick={() => tap(k)} className="flex flex-col items-center"
            initial={{ y: -200 }} animate={{ y: 0, rotate: [0, 4, -4, 0] }} transition={{ y: { type: "spring", stiffness: 60, delay: k * 0.15 }, rotate: { duration: 4, repeat: Infinity, delay: k * 0.4 } }} style={{ transformOrigin: "50% 0%" }}>
            <span className="block w-px bg-amber-300/50" style={{ height: 60 + (k % 2) * 50 }} />
            <Ornament size={64} color={colors[k % colors.length]} style={{ filter: seen.has(k) ? "none" : `drop-shadow(0 0 14px ${colors[k % colors.length]})` }} />
            <span className="mt-2 max-w-[90px] text-center text-[12px] font-semibold text-mid">{o.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="mt-10 w-full">
        {open !== null ? (
          <motion.div key={open} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong p-6 text-center">
            <p className="eyebrow !text-[10px] !text-amber-300">{c.ornaments[open].label}</p>
            <p className="mt-3 text-[21px] leading-[1.45] text-hi" style={{ fontFamily: handFont(c.ornaments[open].message) }}>
              <TypeOut text={c.ornaments[open].message} speed={api.auto ? 18 : 30} />
            </p>
          </motion.div>
        ) : (
          <p className="text-center text-[15px] text-mid">{t("snow.tapOrnament")}</p>
        )}
      </div>
      {!api.auto && seen.size > 0 && (
        <button type="button" onClick={api.next} className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] h-12 rounded-full px-6 font-semibold text-ink-950 [background:var(--grad-kiss)]">{t("continue")}</button>
      )}
    </div>
  );
}

function OnMount({ fn }: { fn: () => void }) {
  useEffect(() => {
    const id = setTimeout(fn, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function SnowGlobe({ content: c, mode, watermark, ctx }: RendererProps<Content>) {
  const t = useTranslations("gift");
  const scenes: Scene[] = [
    { id: "globe", reelMs: 7000, render: (api) => <GlobeScene c={c} api={api} /> },
    { id: "ornaments", reelMs: 2300 * (c.ornaments.length + 1), render: (api) => <Ornaments c={c} api={api} /> },
    {
      id: "finale",
      reelMs: 5200,
      render: () => {
        return (
          <ReplyCard ctx={ctx} mode={mode}>
            <OnMount fn={() => sound.bells()} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} className="text-center">
              <p className="font-display text-[46px] leading-[1.02] text-hi glow-text">{t.rich("snow.merry", { name: c.recipientName, em: (x) => <em className="text-amber-300">{x}</em> })}</p>
              <p className="mx-auto mt-3 max-w-[300px] text-[17px] text-mid" style={{ fontFamily: handFont(c.finale) }}>{c.finale}</p>
              <p className="mt-2 font-display text-[20px] italic text-amber-300">— {c.senderName}</p>
            </motion.div>
            {c.song?.url && <SongCard url={c.song.url} title={c.song.title} mode={mode} />}
          </ReplyCard>
        );
      },
    },
  ];
  return (
    <GiftShell glow="amber" mode={mode} watermark={watermark} ctx={ctx} scenes={scenes} ambient="festive"
      background={<><div className="absolute inset-0" style={{ background: "radial-gradient(80% 50% at 50% 45%, rgba(255,200,112,0.14), transparent 70%), radial-gradient(60% 40% at 80% 10%, rgba(201,182,255,0.16), transparent), radial-gradient(130% 90% at 50% 100%, #1a0f2e, #0b0714 70%)" }} /><Starfield density={1} /></>} />
  );
}
