"use client";
import { useEffect, useState } from "react";

export type Perf = { reduced: boolean; lowEnd: boolean; touch: boolean; inApp: boolean };

let cached: Perf | null = null;

export function detectPerf(): Perf {
  if (cached) return cached;
  if (typeof window === "undefined") return { reduced: false, lowEnd: false, touch: false, inApp: false };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const ua = navigator.userAgent;
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|Snapchat/i.test(ua);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("reduced");
  const forcedLow = new URLSearchParams(location.search).has("lowend");
  const lowEnd = forcedLow || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4 && /Android/i.test(ua));
  const touch = window.matchMedia("(pointer: coarse)").matches;
  cached = { reduced, lowEnd, touch, inApp };
  if (reduced) document.documentElement.classList.add("reduced-motion");
  if (lowEnd) document.documentElement.classList.add("low-end");
  return cached;
}

/** Measures first 60 frames inside in-app browsers; flips to low-end if FPS is poor. */
export function measureFps(cb: (fps: number) => void) {
  let n = 0;
  const start = performance.now();
  const tick = () => {
    n++;
    if (n < 60) requestAnimationFrame(tick);
    else cb((60 * 1000) / (performance.now() - start));
  };
  requestAnimationFrame(tick);
}

export function usePerf(): Perf {
  const [p, setP] = useState<Perf>({ reduced: false, lowEnd: false, touch: false, inApp: false });
  useEffect(() => {
    const d = detectPerf();
    setP(d);
    if (d.inApp && !d.lowEnd) {
      measureFps((fps) => {
        if (fps < 40) {
          cached = { ...d, lowEnd: true };
          document.documentElement.classList.add("low-end");
          setP(cached);
        }
      });
    }
  }, []);
  return p;
}
