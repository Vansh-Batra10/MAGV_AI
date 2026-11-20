"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePerf } from "@/lib/client/perf";
import type { SceneApi } from "@/engines/shell/GiftShell";

export type StorySlide = { id: string; ms?: number; render: (s: { active: boolean; auto: boolean }) => ReactNode };

/**
 * Stories engine: 9:16 slides, tap left/right, progress bars, auto-advance (5s), hold to pause.
 * Reduced motion: no auto-advance (tap only).
 */
export function Stories({ slides, api, defaultMs = 5000 }: { slides: StorySlide[]; api: SceneApi; defaultMs?: number }) {
  const perf = usePerf();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoAdvance = api.auto || !perf.reduced;
  const raf = useRef(0);
  const elapsed = useRef(0);
  const last = useRef(0);

  const iRef = useRef(0);
  iRef.current = i;
  const go = useCallback(
    (d: number) => {
      elapsed.current = 0;
      setProgress(0);
      const n = iRef.current + d;
      if (n >= slides.length) api.next();
      else setI(Math.max(0, n));
    },
    [slides.length, api],
  );

  useEffect(() => {
    if (!autoAdvance) return;
    const dur = (slides[i]?.ms ?? defaultMs) / (api.speed || 1);
    last.current = performance.now();
    const tick = (t: number) => {
      const dt = t - last.current;
      last.current = t;
      if (!paused) elapsed.current += dt;
      const p = Math.min(1, elapsed.current / dur);
      setProgress(p);
      if (p >= 1) go(1);
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [i, paused, autoAdvance, slides, defaultMs, go, api.speed]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="popLayout">
        <motion.div key={slides[i].id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          {slides[i].render({ active: true, auto: api.auto })}
        </motion.div>
      </AnimatePresence>
      <div className="absolute left-3 right-3 top-[max(14px,env(safe-area-inset-top))] z-20 flex gap-1" aria-hidden>
        {slides.map((s, k) => (
          <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full bg-white" style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} />
          </div>
        ))}
      </div>
      {!api.auto && (
        <div className="absolute inset-0 z-10 flex">
          <button type="button" aria-label="previous" className="h-full w-1/3" onClick={() => go(-1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
          <button type="button" aria-label="next" className="h-full w-2/3" onClick={() => go(1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        </div>
      )}
    </div>
  );
}

/** Count-up number for big stats. */
export function CountUp({ to, ms = 1600, className }: { to: number; ms?: number; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [to, ms]);
  return <span className={className}>{v.toLocaleString("en-US")}</span>;
}

/** Ken Burns photo. */
export function KenBurns({ src, i = 0 }: { src: string; i?: number }) {
  const dirs = [
    { from: "scale(1.0) translate(0,0)", to: "scale(1.18) translate(-3%, -2%)" },
    { from: "scale(1.18) translate(3%, 2%)", to: "scale(1.02) translate(0,0)" },
    { from: "scale(1.05) translate(-2%, 3%)", to: "scale(1.2) translate(2%, -2%)" },
  ][i % 3];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src={src} alt="" className="h-full w-full object-cover" style={{ animation: `kb${i % 3} 6s ease-out forwards` }} draggable={false} />
      <style>{`@keyframes kb${i % 3}{from{transform:${dirs.from}}to{transform:${dirs.to}}}`}</style>
    </div>
  );
}
