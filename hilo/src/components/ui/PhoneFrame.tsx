"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const STAGE_W = 390;
export const STAGE_H = 844;

/** Renders children in a fixed 390×844 logical stage, scaled to fit the container width. */
export function ScaledStage({ children, w = STAGE_W, h = STAGE_H, className }: { children: ReactNode; w?: number; h?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / w));
    ro.observe(el);
    setScale(el.clientWidth / w);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className={cn("relative h-full w-full overflow-hidden", className)}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", visibility: scale ? "visible" : "hidden" }} className="absolute left-0 top-0">
        {children}
      </div>
    </div>
  );
}

/** Realistic device frame: 44px radius, dynamic island, side buttons, subtle reflection, optional 3D tilt. */
export function PhoneFrame({ children, className, tilt = false, glow = true }: { children: ReactNode; className?: string; tilt?: boolean; glow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(1200px) rotateY(${px * 12}deg) rotateX(${-py * 10}deg)`;
    if (glare.current) glare.current.style.background = `radial-gradient(500px circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.14), transparent 45%)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
    if (glare.current) glare.current.style.background = "";
  };
  return (
    <div className={cn("relative mx-auto w-full", className)} onPointerMove={onMove} onPointerLeave={onLeave}>
      {glow && <div aria-hidden className="absolute -inset-10 -z-10 rounded-[80px] opacity-70 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(var(--glow-rgb),0.35), transparent)" }} />}
      <div
        ref={ref}
        className="relative w-full rounded-[46px] p-[9px] transition-transform duration-300 ease-[var(--ease-expo)] [transform-style:preserve-3d]"
        style={{
          aspectRatio: `${STAGE_W + 18} / ${STAGE_H + 18}`,
          background: "linear-gradient(145deg, #2a2236 0%, #120d1c 40%, #1d1528 100%)",
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px -30px rgba(0,0,0,0.9), 0 20px 40px -20px rgba(var(--glow-rgb),0.25)",
        }}
      >
        <span aria-hidden className="absolute -left-[3px] top-[18%] h-10 w-[3px] rounded-l bg-[#2a2236]" />
        <span aria-hidden className="absolute -left-[3px] top-[26%] h-16 w-[3px] rounded-l bg-[#2a2236]" />
        <span aria-hidden className="absolute -right-[3px] top-[22%] h-20 w-[3px] rounded-r bg-[#2a2236]" />
        <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-ink-950 [container-type:size]">
          <ScaledStage>{children}</ScaledStage>
          <div aria-hidden className="absolute left-1/2 top-[1.6%] z-30 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-30 rounded-[38px]" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)" }} />
          <div ref={glare} aria-hidden className="pointer-events-none absolute inset-0 z-30 transition-[background] duration-200" />
        </div>
      </div>
    </div>
  );
}
