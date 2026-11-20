"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Thin glowing red-thread divider that draws itself in when scrolled into view. */
export function ThreadDivider({ className, d = "M0 20 C 200 0, 400 40, 600 20 S 1000 0, 1200 20" }: { className?: string; d?: string }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        p.style.strokeDashoffset = "0";
        io.disconnect();
      }
    });
    io.observe(p);
    return () => io.disconnect();
  }, []);
  return (
    <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className={cn("h-10 w-full overflow-visible", className)} aria-hidden>
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke="var(--rose-500)"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
        vectorEffect="non-scaling-stroke"
        style={{ transition: "stroke-dashoffset 2.2s var(--ease-expo)", filter: "drop-shadow(0 0 6px rgba(255,77,126,0.7))" }}
      />
    </svg>
  );
}

/** A thread arc between two points (percent coords) used in heroes. */
export function ThreadArc({ className, animate = true, color = "var(--rose-500)", d = "M -20 520 C 300 420, 520 120, 1220 40" }: { className?: string; animate?: boolean; color?: string; d?: string }) {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="8" vectorEffect="non-scaling-stroke" style={{ filter: "blur(6px)" }}
        pathLength={1} strokeDasharray="1" strokeDashoffset={animate ? 1 : 0} className={animate ? "[animation:draw_2.6s_var(--ease-expo)_0.3s_forwards]" : ""} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"
        pathLength={1} strokeDasharray="1" strokeDashoffset={animate ? 1 : 0} className={animate ? "[animation:draw_2.6s_var(--ease-expo)_0.3s_forwards]" : ""} />
    </svg>
  );
}
