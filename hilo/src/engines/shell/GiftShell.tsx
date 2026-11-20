"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";
import type { Glow } from "@/config/occasions";
import type { GiftContext, RenderMode } from "@/templates/types";
import { sound } from "@/lib/client/sound";
import { haptic } from "@/lib/client/haptics";
import { Envelope } from "@/components/art";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";
import { initials } from "./util";

export type SceneApi = { next: () => void; auto: boolean; mode: RenderMode; speed: number; active: boolean };
export type Scene = {
  id: string;
  /** Duration in reel/thumbnail autoplay. */
  reelMs: number;
  /** Whole scene is tappable to continue (for passive scenes). */
  tapToContinue?: boolean;
  render: (api: SceneApi) => ReactNode;
};

type Props = {
  glow: Glow;
  theme?: "night" | "paper";
  mode: RenderMode;
  watermark: boolean;
  ctx: GiftContext;
  scenes: Scene[];
  background?: ReactNode;
  ambient?: "warm" | "night" | "festive";
  hideDots?: boolean;
  /** Skip the envelope gate (e.g. Stories engine has its own). */
  noGate?: boolean;
};

export function GiftShell({ glow, theme = "night", mode, watermark, ctx, scenes, background, ambient = "night", hideDots, noGate }: Props) {
  const t = useTranslations("gift");
  const auto = mode === "reel" || mode === "thumbnail";
  const speed = ctx.speed ?? 1;
  const [opened, setOpened] = useState(noGate || mode === "thumbnail");
  const [i, setI] = useState(0);
  const [hint, setHint] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const nScenes = scenes.length;

  useEffect(() => sound.subscribe(setSoundOn) as unknown as () => void, []);

  const next = useCallback(() => {
    setHint(false);
    setI((x) => {
      if (x < nScenes - 1) return x + 1;
      return auto ? 0 : x; // loop in autoplay modes
    });
  }, [nScenes, auto]);

  const open = useCallback(() => {
    if (opened) return;
    haptic([12, 40, 18]);
    if (mode === "live" || mode === "preview") {
      sound.setOn(true);
      sound.pop();
      setTimeout(() => sound.ambient(ambient), 400);
    }
    setOpened(true);
  }, [opened, mode, ambient]);

  // Autoplay (reel / thumbnail)
  useEffect(() => {
    if (!auto) return;
    if (!opened) {
      const id = setTimeout(open, 1400 / speed);
      return () => clearTimeout(id);
    }
    const id = setTimeout(next, scenesRef.current[i].reelMs / speed);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, opened, i, speed]);

  // "Tap to continue" hint for passive scenes
  useEffect(() => {
    if (auto || !opened || !scenesRef.current[i]?.tapToContinue) return;
    const id = setTimeout(() => setHint(true), 2600);
    return () => clearTimeout(id);
  }, [i, opened, auto]);

  // Keyboard navigation
  useEffect(() => {
    if (mode !== "live" && mode !== "preview") return;
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current?.isConnected) return;
      if (!opened && (e.key === "Enter" || e.key === " ")) open();
      else if (e.key === "ArrowRight" && scenes[i]?.tapToContinue) next();
      else if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, opened, open, next, i, scenes]);

  useEffect(() => () => sound.setOn(false), []);

  const scene = scenes[i];
  const api: SceneApi = { next, auto, mode, speed, active: opened };

  return (
    <div ref={rootRef} data-glow={glow} className={cn("relative h-full w-full select-none overflow-hidden", theme === "paper" ? "bg-[#2a1e1a]" : "bg-ink-950")} style={{ fontFamily: "var(--font-manrope)" }}>
      <div className="absolute inset-0">{background}</div>

      {/* top chrome */}
      {opened && !hideDots && scenes.length > 1 && (
        <div className="absolute left-0 right-0 top-0 z-20 flex justify-center gap-1.5 pt-[max(18px,env(safe-area-inset-top))]" aria-hidden>
          {scenes.map((s, k) => (
            <span key={s.id} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-5 bg-[var(--glow)] shadow-[0_0_10px_var(--glow)]" : k < i ? "w-1.5 bg-white/60" : "w-1.5 bg-white/20")} />
          ))}
        </div>
      )}
      {(mode === "live" || mode === "preview") && opened && (
        <button
          type="button"
          onClick={() => {
            sound.setOn(!soundOn);
            if (!soundOn) setTimeout(() => sound.ambient(ambient), 50);
          }}
          aria-label={soundOn ? t("soundOff") : t("soundOn")}
          className="absolute right-3 top-[max(10px,env(safe-area-inset-top))] z-30 grid h-11 w-11 place-items-center rounded-full bg-black/25 text-white/80 backdrop-blur-md"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.button
            key="gate"
            type="button"
            onClick={open}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-7 px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow !text-[11px] text-mid">{ctx.senderFirstName ? t("from", { name: ctx.senderFirstName }) : BRAND.name}</p>
            <h1 className="font-display text-[40px] leading-[1.05] text-hi glow-text">
              {t.rich("surpriseFor", { name: ctx.recipientName || "you", em: (c) => <em className="text-[var(--glow)]">{c}</em> })}
            </h1>
            <div className="anim-floaty relative">
              <div className="absolute inset-0 -z-10 scale-150 rounded-full opacity-60 blur-2xl" style={{ background: "radial-gradient(closest-side, rgba(var(--glow-rgb),0.6), transparent)" }} />
              <Envelope size={210} initials={initials(ctx.recipientName)} />
            </div>
            <span className="glass inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold text-hi" style={{ animation: "pulse-glow 2.4s ease-in-out infinite" }}>
              {t("tapToOpen")}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key={scene.id}
            className="absolute inset-0 z-10"
            initial={{ opacity: 0, filter: "blur(10px)", scale: 1.02 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
            transition={{ duration: auto ? 0.6 : 0.75, ease: [0.22, 1, 0.36, 1] }}
            onClick={scene.tapToContinue && !auto ? next : undefined}
          >
            {scene.render(api)}
            {hint && (
              <div className="pointer-events-none absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-0 right-0 text-center text-[13px] font-medium text-white/60" style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>
                {t("tapToContinue")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {watermark && <Watermark />}
    </div>
  );
}

export function Watermark() {
  const t = useTranslations("gift");
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] flex-col gap-24 whitespace-nowrap">
        {[0, 1, 2, 3, 4].map((k) => (
          <span key={k} className="font-display text-[34px] italic text-white/[0.09]" style={{ marginLeft: k % 2 ? 120 : 0 }}>
            {t("previewWatermark", { brand: BRAND.name })} · {t("previewWatermark", { brand: BRAND.name })}
          </span>
        ))}
      </div>
    </div>
  );
}
