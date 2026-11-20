"use client";
import { useEffect, useRef } from "react";
import { detectPerf } from "@/lib/client/perf";
import { cn } from "@/lib/cn";

/** Slow-twinkling star canvas. ≤150 stars on mobile, pauses when the tab is hidden or offscreen. */
export function Starfield({ className, density = 1, brighten = false, shooting = true }: { className?: string; density?: number; brighten?: boolean; shooting?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const brightRef = useRef(brighten);
  brightRef.current = brighten;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const perf = detectPerf();
    let w = 0, h = 0, raf = 0, visible = true, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Star = { x: number; y: number; r: number; p: number; s: number; hue: number };
    let stars: Star[] = [];
    let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const max = (perf.touch || w < 768 ? 150 : 320) * (perf.lowEnd ? 0.5 : 1);
      const n = Math.min(max, Math.round(((w * h) / 5200) * density));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.8 : 0.4 + Math.random() * 0.8,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.2,
        hue: Math.random() < 0.15 ? 340 : Math.random() < 0.2 ? 40 : 260,
      }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const boost = brightRef.current ? 1.5 : 1;
      for (const s of stars) {
        const a = perf.reduced ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 100%, 92%, ${Math.min(1, a * boost)})`;
        ctx.arc(s.x, s.y, s.r * (brightRef.current ? 1.2 : 1), 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          ctx.fillStyle = `hsla(${s.hue}, 100%, 85%, ${0.12 * a})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (shooting && !perf.reduced && !perf.lowEnd) {
        if (!shoot && Math.random() < 0.002) shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.4, vx: 6 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 1 };
        if (shoot) {
          const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 14, shoot.y - shoot.vy * 14);
          g.addColorStop(0, `rgba(255,245,248,${shoot.life})`);
          g.addColorStop(1, "rgba(255,245,248,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(shoot.x, shoot.y);
          ctx.lineTo(shoot.x - shoot.vx * 14, shoot.y - shoot.vy * 14);
          ctx.stroke();
          shoot.x += shoot.vx;
          shoot.y += shoot.vy;
          shoot.life -= 0.02;
          if (shoot.life <= 0) shoot = null;
        }
      }
    };
    const loop = (t: number) => {
      if (running && visible) draw(t);
      raf = requestAnimationFrame(loop);
    };
    resize();
    draw(0);
    if (!perf.reduced) raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const onVis = () => (running = document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density, shooting]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}
