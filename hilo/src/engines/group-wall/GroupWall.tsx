"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { Contribution } from "@/templates/types";
import type { SceneApi } from "@/engines/shell/GiftShell";
import { VoicePlayer, handFont } from "@/engines/shell/blocks";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";

const NOTE_COLORS = ["#FFE4EC", "#FFF1C9", "#E8E0FF", "#FFE0D3", "#E0F5EC"];

/**
 * Group Wall engine: polaroids & sticky notes pinned to a starry corkboard.
 * Handles up to 100 contributions; offscreen cards use `content-visibility: auto` (cheap virtualisation).
 */
export function Corkboard({ items, api }: { items: Contribution[]; api: SceneApi }) {
  const t = useTranslations("gift");
  const [open, setOpen] = useState<Contribution | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!api.auto || !scrollEl) return;
    let raf = 0;
    const tick = () => {
      scrollEl.scrollTop += 0.9 * api.speed;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [api.auto, scrollEl, api.speed]);
  return (
    <div className="absolute inset-0">
      <div ref={setScrollEl} className="no-scrollbar absolute inset-0 overflow-y-auto px-4 pb-28 pt-16">
        <p className="mb-5 text-center font-display text-[30px] leading-tight text-hi">{t("group.board", { n: items.length })}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {items.map((it, k) => {
            const rot = ((k * 37) % 9) - 4;
            const isPhoto = !!it.photoUrl;
            return (
              <motion.button
                key={it.id}
                type="button"
                onClick={() => {
                  haptic(10);
                  sound.rustle(0.25);
                  setOpen(it);
                }}
                initial={{ opacity: 0, y: 30, rotate: rot * 2 }}
                animate={{ opacity: 1, y: 0, rotate: rot }}
                transition={{ delay: Math.min(k, 12) * 0.06, type: "spring", stiffness: 120, damping: 14 }}
                className="relative text-left [content-visibility:auto] [contain-intrinsic-size:180px]"
              >
                <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-rose-500 shadow-[0_2px_6px_rgba(0,0,0,.5),inset_0_-2px_0_rgba(0,0,0,.2)]" />
                {isPhoto ? (
                  <div className="rounded-[3px] bg-cream-50 p-1.5 pb-2 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.85)]">
                    <img src={it.photoUrl!} alt="" loading="lazy" className="aspect-square w-full object-cover" draggable={false} />
                    <p className="mt-1.5 line-clamp-2 px-1 text-[13px] leading-tight text-ink-text" style={{ fontFamily: handFont(it.message) }}>{it.message}</p>
                    <p className="mt-1 px-1 text-right text-[12px] font-semibold text-[#a8123f]">— {it.name}</p>
                  </div>
                ) : (
                  <div className="min-h-[150px] rounded-[2px] p-3.5 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.85)]" style={{ background: NOTE_COLORS[k % NOTE_COLORS.length] }}>
                    <p className="line-clamp-5 text-[15px] leading-snug text-ink-text" style={{ fontFamily: handFont(it.message) }}>{it.message}</p>
                    <p className="mt-2 text-right text-[12px] font-semibold text-[#a8123f]">— {it.name}</p>
                  </div>
                )}
                {it.voiceUrl && <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-ink-950 text-[13px] shadow-lg" aria-label="voice">🎙️</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
      {!api.auto && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent pb-[max(24px,env(safe-area-inset-bottom))] pt-10">
          <button type="button" onClick={api.next} className="pointer-events-auto h-12 rounded-full px-6 font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.7)]">{t("group.finale")}</button>
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div initial={{ scale: 0.85, rotate: -3 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="paper relative w-full max-w-[340px] rounded-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setOpen(null)} className="absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full text-ink-text/60" aria-label={t("close")}><X size={18} /></button>
              {open.photoUrl && <img src={open.photoUrl} alt="" className="mb-3 aspect-[4/5] w-full rounded-sm object-cover" />}
              <p className="whitespace-pre-line text-[19px] leading-[1.5] text-ink-text" style={{ fontFamily: handFont(open.message) }}>{open.message}</p>
              <p className="mt-3 text-right font-display text-[20px] italic text-[#a8123f]">— {open.name}</p>
              {open.voiceUrl && <div className="mt-3 [--glow:#d9305f]"><VoicePlayer src={open.voiceUrl} /></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Heart-shaped mosaic of every photo, then movie-credits roll of names. */
export function HeartMosaic({ items, fallbackPhotos }: { items: Contribution[]; fallbackPhotos: string[] }) {
  const photos = useMemo(() => {
    const p = items.map((i) => i.photoUrl).filter(Boolean) as string[];
    const src = p.length ? p : fallbackPhotos;
    return src.length ? src : [];
  }, [items, fallbackPhotos]);
  const cells = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const N = 15;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const x = (c - (N - 1) / 2) / (N / 2.4), y = -(r - (N - 1) / 2) / (N / 2.4) + 0.25;
        if (Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0) out.push({ x: c, y: r });
      }
    return out;
  }, []);
  const size = 300 / 15;
  return (
    <div className="relative" style={{ width: 300, height: 300 }}>
      {cells.map((cell, k) => (
        <motion.div key={k} className="absolute overflow-hidden rounded-[3px]" style={{ width: size - 2, height: size - 2, left: cell.x * size, top: cell.y * size }}
          initial={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 800, rotate: (Math.random() - 0.5) * 180 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
          transition={{ duration: 1.4, delay: (k % 40) * 0.025, ease: [0.22, 1, 0.36, 1] }}>
          {photos.length ? <img src={photos[k % photos.length]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-rose-500" />}
        </motion.div>
      ))}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "0 0 80px 10px rgba(255,77,126,0.35)", borderRadius: "50%" }} />
    </div>
  );
}

export function Credits({ names, title, auto }: { names: string[]; title: string; auto: boolean }) {
  const dur = Math.max(10, names.length * 0.9);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 text-center" style={{ animation: `credits ${auto ? dur * 0.6 : dur}s linear forwards`, top: "100%" }}>
        <p className="font-display text-[44px] italic text-hi glow-text">{title}</p>
        <div className="mt-8 flex flex-col gap-3">
          {names.map((n, k) => (
            <p key={k} className="text-[18px] font-medium tracking-wide text-mid">{n}</p>
          ))}
        </div>
      </div>
      <style>{`@keyframes credits{from{transform:translateY(0)}to{transform:translateY(calc(-100% - 900px))}}`}</style>
    </div>
  );
}
