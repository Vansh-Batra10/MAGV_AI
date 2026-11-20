"use client";
import { useEffect, useRef, useState } from "react";
import { TEMPLATES } from "@/templates/registry";
import { THREAD_LOGO_PATH } from "@/components/ui/Logo";
import { BRAND } from "@/config/brand";

const GLOW: Record<string, string> = { rose: "#FF4D7E", amber: "#FFC870", lavender: "#C9B6FF" };

/** Reel cover generator: dark ink, one glow, Instrument Serif italic headline, thread motif. */
export function CoverGenerator() {
  const [slug, setSlug] = useState(TEMPLATES[0].meta.slug);
  const [headline, setHeadline] = useState("Some things don't fit in a text.");
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number]>([1080, 1920]);
  const tpl = TEMPLATES.find((t) => t.meta.slug === slug)!;
  useEffect(() => {
    const c = ref.current!;
    const [W, H] = size;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const glow = GLOW[tpl.meta.glow];
    const draw = (img?: HTMLImageElement) => {
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.3, 10, W * 0.5, H * 0.5, H * 0.8);
      bg.addColorStop(0, "#3B1F5C");
      bg.addColorStop(1, "#0B0714");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      if (img) {
        ctx.globalAlpha = 0.35;
        const s = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
        ctx.globalAlpha = 1;
        const fade = ctx.createLinearGradient(0, 0, 0, H);
        fade.addColorStop(0, "rgba(11,7,20,0.6)");
        fade.addColorStop(1, "rgba(11,7,20,0.95)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, W, H);
      }
      const g2 = ctx.createRadialGradient(W * 0.7, H * 0.25, 0, W * 0.7, H * 0.25, W * 0.7);
      g2.addColorStop(0, glow + "55");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 4;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(-20, H * 0.85);
      ctx.bezierCurveTo(W * 0.3, H * 0.7, W * 0.45, H * 0.25, W + 20, H * 0.12);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFF5F8";
      ctx.font = `italic ${Math.round(W * 0.11)}px "Instrument Serif", serif`;
      const words = headline.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if (ctx.measureText(line + " " + w).width > W * 0.82 && line) {
          lines.push(line);
          line = w;
        } else line = line ? line + " " + w : w;
      }
      lines.push(line);
      const lh = W * 0.12;
      const top = H * 0.42 - (lines.length * lh) / 2;
      lines.forEach((l, i) => ctx.fillText(l, W * 0.09, top + i * lh));
      ctx.save();
      ctx.translate(W * 0.09, H - (H > 1500 ? 380 : 160));
      ctx.scale(2.2, 2.2);
      ctx.strokeStyle = "#FF4D7E";
      ctx.lineWidth = 2.4;
      ctx.stroke(new Path2D(THREAD_LOGO_PATH));
      ctx.restore();
      ctx.font = `italic ${Math.round(W * 0.055)}px "Instrument Serif", serif`;
      ctx.fillText(BRAND.name, W * 0.09 + 160, H - (H > 1500 ? 330 : 110));
    };
    const img = new Image();
    img.onload = () => draw(img);
    img.src = tpl.meta.demoPoster;
    draw();
  }, [slug, headline, size, tpl]);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <div className="flex flex-col gap-3">
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-hi">{TEMPLATES.map((t) => <option key={t.meta.slug} className="bg-ink-900">{t.meta.slug}</option>)}</select>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-hi" aria-label="Headline" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setSize([1080, 1920])} className="h-10 rounded-full bg-white/10 px-4 text-sm text-hi">1080×1920</button>
          <button type="button" onClick={() => setSize([1080, 1350])} className="h-10 rounded-full bg-white/10 px-4 text-sm text-hi">1080×1350</button>
          <button type="button" onClick={() => { const a = document.createElement("a"); a.href = ref.current!.toDataURL("image/png"); a.download = `cover-${slug}-${size[0]}x${size[1]}.png`; a.click(); }} className="h-10 rounded-full px-4 text-sm font-semibold text-white [background:var(--grad-kiss)]">Download</button>
        </div>
      </div>
      <canvas ref={ref} className="w-full rounded-2xl border border-white/10" />
    </div>
  );
}
