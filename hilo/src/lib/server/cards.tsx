import "server-only";
import { BRAND } from "@/config/brand";

const GLOW: Record<string, { c: string; rgb: string }> = { rose: { c: "#FF4D7E", rgb: "255,77,126" }, amber: { c: "#FFC870", rgb: "255,200,112" }, lavender: { c: "#C9B6FF", rgb: "201,182,255" } };

let fonts: { name: string; data: ArrayBuffer; style: "normal" | "italic"; weight: 400 | 600 }[] | null = null;

/** Fonts for next/og: fetched once from Google Fonts (TTF), cached in memory. Falls back to system fonts. */
export async function ogFonts() {
  if (fonts) return fonts;
  const get = async (family: string, ital: boolean) => {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:ital@${ital ? 1 : 0}`, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    if (!url) throw new Error("font");
    return (await fetch(url)).arrayBuffer();
  };
  try {
    const [serif, serifI] = await Promise.all([get("Instrument+Serif", false), get("Instrument+Serif", true)]);
    fonts = [
      { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
      { name: "Instrument Serif", data: serifI, style: "italic", weight: 400 },
    ];
  } catch {
    fonts = [];
  }
  return fonts;
}

function Thread({ color, w, h }: { color: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 1200 600" style={{ position: "absolute", left: 0, top: 0 }}>
      <path d="M -20 520 C 300 420, 520 120, 1220 40" stroke={color} strokeWidth="5" fill="none" opacity="0.9" />
    </svg>
  );
}

function Mark({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 30) / 64} viewBox="0 0 64 30">
      <path d="M4 24 C 14 24, 24 24, 32 22 C 26 18, 21 13, 21 9 C 21 5, 25 3.5, 28 4.5 C 30.5 5.3, 31.5 7, 32 9 C 32.5 7, 33.5 5.3, 36 4.5 C 39 3.5, 43 5, 43 9 C 43 13, 38 18, 32 22 C 40 24, 50 24, 60 24" fill="none" stroke="#FF4D7E" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="4" cy="24" r="3" fill="#FF7A9C" />
      <circle cx="60" cy="24" r="3" fill="#FF7A9C" />
    </svg>
  );
}

/** 1200×630 OG card. Never includes the recipient's photos (privacy). */
export function OgCard({ title, sub, glow = "rose" }: { title: string; sub?: string; glow?: string }) {
  const g = GLOW[glow] ?? GLOW.rose;
  return (
    <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, position: "relative", background: `radial-gradient(90% 80% at 75% 10%, rgba(${g.rgb},0.28), transparent 60%), radial-gradient(120% 120% at 20% 100%, #3B1F5C, #0B0714 70%)`, color: "#FFF5F8", fontFamily: "Instrument Serif" }}>
      <Thread color={g.c} w={1200} h={630} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontStyle: "italic" }}><Mark /> {BRAND.name}</div>
      <div style={{ fontSize: 96, lineHeight: 1.02, marginTop: 40, display: "flex", maxWidth: 1000 }}>{title}</div>
      {sub && <div style={{ fontSize: 40, fontStyle: "italic", color: g.c, marginTop: 20 }}>{sub}</div>}
    </div>
  );
}

/** 1080×1920 Instagram story card with a sticker-like QR. Text kept out of IG UI zones (top 220, bottom 320). */
export function StoryCard({ headline, accent, glow = "rose", qr, templateName }: { headline: string; accent: string; glow?: string; qr: string; templateName: string }) {
  const g = GLOW[glow] ?? GLOW.rose;
  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", background: `radial-gradient(80% 50% at 50% 30%, rgba(${g.rgb},0.35), transparent 70%), radial-gradient(120% 90% at 50% 100%, #3B1F5C, #0B0714 70%)`, color: "#FFF5F8", fontFamily: "Instrument Serif" }}>
      <Thread color={g.c} w={1080} h={1920} />
      <div style={{ marginTop: 300, fontSize: 40, letterSpacing: 8, textTransform: "uppercase", color: "rgba(255,245,248,0.7)", fontFamily: "sans-serif" }}>{templateName}</div>
      <div style={{ marginTop: 60, fontSize: 130, lineHeight: 1.0, textAlign: "center", padding: "0 90px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span>{headline}</span>
        <span style={{ fontStyle: "italic", color: g.c }}>{accent}</span>
      </div>
      <div style={{ marginTop: 110, display: "flex", padding: 26, background: "#FFF8EF", borderRadius: 40, transform: "rotate(-4deg)", boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 10px rgba(${g.rgb},0.6)` }}>
        <img src={qr} width={340} height={340} alt="" />
      </div>
      <div style={{ position: "absolute", bottom: 360, display: "flex", alignItems: "center", gap: 18, fontSize: 52, fontStyle: "italic" }}><Mark size={80} /> {BRAND.name}</div>
    </div>
  );
}
