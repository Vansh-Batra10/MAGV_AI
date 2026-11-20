"use client";
import { useEffect, useRef } from "react";
import { detectPerf } from "@/lib/client/perf";

/** Subtle trailing red thread behind the desktop cursor. Off on touch & reduced motion. */
export function CursorThread() {
  const ref = useRef<SVGPolylineElement>(null);
  useEffect(() => {
    const perf = detectPerf();
    if (perf.touch || perf.reduced || perf.lowEnd) return;
    const pts: { x: number; y: number }[] = [];
    let mx = -100, my = -100, raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
    };
    const tick = () => {
      pts.unshift({ x: mx, y: my });
      if (pts.length > 18) pts.pop();
      for (let i = 1; i < pts.length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.35;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.35;
      }
      ref.current?.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full">
      <polyline ref={ref} fill="none" stroke="var(--rose-500)" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px rgba(255,77,126,0.8))" }} />
    </svg>
  );
}
