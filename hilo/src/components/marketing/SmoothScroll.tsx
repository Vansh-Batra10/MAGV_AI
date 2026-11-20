"use client";
import { useEffect } from "react";
import { detectPerf } from "@/lib/client/perf";

/** Lenis smooth scroll on marketing pages only (never on gift pages). Off for reduced motion / touch / low-end. */
export function SmoothScroll() {
  useEffect(() => {
    const p = detectPerf();
    if (p.reduced || p.touch || p.lowEnd) return;
    let raf = 0;
    let destroy = () => {};
    void import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({ lerp: 0.12 });
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelAnimationFrame(raf);
      destroy();
    };
  }, []);
  return null;
}
