"use client";
import { useEffect, useRef } from "react";

/** 2D canvas snow globe (fallback for low-end / reduced motion / thumbnails). `shakeRef` is bumped on shake. */
export default function Globe2D({ photo, shake, size = 300 }: { photo: string; shake: number; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef(shake);
  const energy = useRef(1);
  useEffect(() => {
    if (shake !== shakeRef.current) {
      shakeRef.current = shake;
      energy.current = 1;
    }
  }, [shake]);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    ctx.scale(dpr, dpr);
    const R = size / 2;
    const flakes = Array.from({ length: 140 }, () => ({ x: Math.random() * size, y: Math.random() * size, r: 0.8 + Math.random() * 2.2, vx: 0, vy: 0.2 + Math.random() * 0.5 }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, size, size);
      const e = energy.current;
      energy.current *= 0.985;
      for (const f of flakes) {
        f.vx += (Math.random() - 0.5) * 0.6 * e;
        f.vy += (Math.random() - 0.62) * 0.6 * e + 0.012;
        f.vx *= 0.96;
        f.vy = Math.min(f.vy * 0.97 + 0.01, 1.2);
        f.x += f.vx + Math.sin((f.y + f.r * 30) / 30) * 0.15;
        f.y += f.vy;
        const dx = f.x - R, dy = f.y - R;
        if (dx * dx + dy * dy > (R - 6) ** 2) {
          if (f.y > R) {
            f.y = R - Math.random() * R;
            f.x = R + (Math.random() - 0.5) * R;
            f.vy = 0;
          } else {
            f.x = R + dx * 0.9;
            f.y = R + dy * 0.9;
            f.vx *= -0.5;
          }
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.55 + f.r / 6})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [size]);
  return (
    <div className="relative" style={{ width: size, height: size * 1.22 }}>
      <div className="absolute left-0 top-0 overflow-hidden rounded-full" style={{ width: size, height: size, boxShadow: "inset 0 0 40px rgba(201,182,255,0.35), 0 0 60px -10px rgba(255,200,112,0.45)" }}>
        <img src={photo} alt="" className="absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover opacity-95" draggable={false} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 120%, rgba(240,235,255,0.9) 0 22%, transparent 23%)" }} />
        <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.45), rgba(255,255,255,0.05) 22%, transparent 40%), radial-gradient(circle at 70% 80%, transparent 55%, rgba(201,182,255,0.25) 75%)", border: "1.5px solid rgba(255,255,255,0.28)" }} />
      </div>
      <svg viewBox="0 0 300 80" className="absolute bottom-0 left-0 w-full" aria-hidden>
        <defs><linearGradient id="wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a8572e" /><stop offset="1" stopColor="#5a2614" /></linearGradient></defs>
        <path d="M50 4 Q150 22 250 4 L272 62 Q150 78 28 62Z" fill="url(#wood)" />
        <path d="M60 30 Q150 44 240 30" stroke="#ffc870" strokeOpacity="0.45" strokeWidth="2" fill="none" />
        <rect x="18" y="60" width="264" height="16" rx="6" fill="#4a1e10" />
      </svg>
    </div>
  );
}
