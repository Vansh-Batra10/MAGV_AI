/* Hand-built SVG illustrations. Soft gradients, thin strokes, gentle glow. No clip-art, no characters. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const box = (size: number | undefined, vb: string, p: P) => ({ viewBox: vb, width: size ?? p.width, height: size ?? p.height, "aria-hidden": true, ...p });

export function Moon({ size = 80, ...p }: P) {
  return (
    <svg {...box(size, "0 0 100 100", p)}>
      <defs>
        <radialGradient id="mg" cx="40%" cy="40%"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#d9ccff" /></radialGradient>
        <filter id="mglow"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <circle cx="50" cy="50" r="34" fill="#c9b6ff" opacity="0.5" filter="url(#mglow)" />
      <circle cx="50" cy="50" r="28" fill="url(#mg)" />
      <circle cx="40" cy="44" r="4" fill="#b9a6ef" opacity="0.5" /><circle cx="58" cy="58" r="6" fill="#b9a6ef" opacity="0.35" /><circle cx="56" cy="38" r="2.5" fill="#b9a6ef" opacity="0.4" />
    </svg>
  );
}

export function Crescent({ size = 80, ...p }: P) {
  return (
    <svg {...box(size, "0 0 100 100", p)}>
      <defs><filter id="cglow"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <path d="M62 18a34 34 0 1 0 20 52A28 28 0 1 1 62 18z" fill="#c9b6ff" opacity="0.45" filter="url(#cglow)" />
      <path d="M62 18a34 34 0 1 0 20 52A28 28 0 1 1 62 18z" fill="#f4eeff" />
    </svg>
  );
}

export function Envelope({ size = 160, sealed = true, open = 0, initials = "", ...p }: P & { sealed?: boolean; open?: number; initials?: string }) {
  return (
    <svg {...box(size, "0 0 200 140", p)} style={{ overflow: "visible", ...p.style }}>
      <defs>
        <linearGradient id="envB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff8ef" /><stop offset="1" stopColor="#f3e6d3" /></linearGradient>
        <linearGradient id="envF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6eadb" /><stop offset="1" stopColor="#ead8c0" /></linearGradient>
        <radialGradient id="seal" cx="40%" cy="35%"><stop offset="0" stopColor="#ff7a9c" /><stop offset="0.7" stopColor="#d9305f" /><stop offset="1" stopColor="#a8123f" /></radialGradient>
      </defs>
      <rect x="4" y="20" width="192" height="116" rx="10" fill="url(#envB)" />
      <path d="M4 132 L84 76 Q100 66 116 76 L196 132" fill="none" stroke="#e2cfb4" strokeWidth="1.5" />
      <g style={{ transformOrigin: "100px 22px", transform: `rotateX(${open * 180}deg)`, transition: "transform .9s var(--ease-expo)" }}>
        <path d="M4 24 Q4 20 10 20 L190 20 Q196 20 196 24 L108 86 Q100 92 92 86Z" fill="url(#envF)" stroke="#e2cfb4" strokeWidth="1" />
      </g>
      {sealed && (
        <g>
          <circle cx="100" cy="84" r="17" fill="url(#seal)" />
          <circle cx="100" cy="84" r="12.5" fill="none" stroke="#ffb3c6" strokeOpacity="0.55" strokeWidth="1" />
          {initials ? (
            <text x="100" y="89" textAnchor="middle" fontFamily="var(--font-instrument)" fontStyle="italic" fontSize="14" fill="#ffe4ec">{initials.slice(0, 2)}</text>
          ) : (
            <path d="M100 91c-6-4-9-7-9-10.5a4.2 4.2 0 0 1 9-1.5 4.2 4.2 0 0 1 9 1.5c0 3.5-3 6.5-9 10.5z" fill="#ffe4ec" />
          )}
        </g>
      )}
    </svg>
  );
}

export function WaxSeal({ size = 60, initials = "", ...p }: P & { initials?: string }) {
  return (
    <svg {...box(size, "0 0 60 60", p)}>
      <defs><radialGradient id="ws" cx="40%" cy="35%"><stop offset="0" stopColor="#ff7a9c" /><stop offset="0.7" stopColor="#d9305f" /><stop offset="1" stopColor="#8f0f36" /></radialGradient></defs>
      <path d="M30 3c4 0 5 3 8 4s6-1 8 2 0 6 2 8 5 3 5 7-3 5-3 8 3 6 1 9-6 2-8 4-2 6-6 6-6-3-8-3-5 3-8 1-1-6-3-8-6-1-7-5 2-6 1-9-4-5-2-8 6-2 8-4 1-6 4-8 6 1 8 0 5-4 8-4z" fill="url(#ws)" />
      <circle cx="30" cy="30" r="15" fill="none" stroke="#ffb3c6" strokeOpacity="0.5" />
      {initials ? <text x="30" y="35" textAnchor="middle" fontFamily="var(--font-instrument)" fontStyle="italic" fontSize="15" fill="#ffe4ec">{initials.slice(0, 2)}</text> : <path d="M30 37c-5-3.4-7.5-6-7.5-9a3.6 3.6 0 0 1 7.5-1.3 3.6 3.6 0 0 1 7.5 1.3c0 3-2.5 5.6-7.5 9z" fill="#ffe4ec" />}
    </svg>
  );
}

export function Lantern({ size = 60, lit = true, ...p }: P & { lit?: boolean }) {
  return (
    <svg {...box(size, "0 0 60 80", p)}>
      <defs>
        <radialGradient id="lg" cx="50%" cy="55%"><stop offset="0" stopColor="#fff2cf" /><stop offset="0.5" stopColor="#ffc870" /><stop offset="1" stopColor="#ff8a65" /></radialGradient>
        <filter id="lglow"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      {lit && <ellipse cx="30" cy="42" rx="26" ry="30" fill="#ffc870" opacity="0.35" filter="url(#lglow)" />}
      <path d="M14 18 Q30 10 46 18 L50 58 Q30 68 10 58Z" fill={lit ? "url(#lg)" : "#5a3a4a"} />
      <path d="M22 16 L22 60 M38 16 L38 60" stroke="#c8693a" strokeOpacity="0.35" />
      <rect x="22" y="62" width="16" height="5" rx="2" fill="#8a3f22" />
    </svg>
  );
}

export function Candle({ size = 40, lit = true, ...p }: P & { lit?: boolean }) {
  return (
    <svg {...box(size, "0 0 40 100", p)} style={{ overflow: "visible", ...p.style }}>
      <defs>
        <linearGradient id="cw" x1="0" x2="1"><stop offset="0" stopColor="#e9dcff" /><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor="#c9b6ff" /></linearGradient>
        <radialGradient id="fl" cx="50%" cy="70%"><stop offset="0" stopColor="#fff" /><stop offset="0.4" stopColor="#ffe08a" /><stop offset="1" stopColor="#ff8a65" stopOpacity="0" /></radialGradient>
      </defs>
      {lit && <circle cx="20" cy="18" r="22" fill="#ffc870" opacity="0.28" style={{ filter: "blur(6px)" }} />}
      <rect x="12" y="38" width="16" height="60" rx="5" fill="url(#cw)" />
      <path d="M12 52 l16 -6 M12 66 l16 -6 M12 80 l16 -6" stroke="#ff7a9c" strokeWidth="2.5" opacity="0.6" />
      <line x1="20" y1="38" x2="20" y2="30" stroke="#3a2a2a" strokeWidth="1.5" />
      {lit && <ellipse className="anim-flicker" cx="20" cy="20" rx="7" ry="13" fill="url(#fl)" />}
    </svg>
  );
}

export function Polaroid({ src, caption, rotate = 0, className, style }: { src: string; caption?: string; rotate?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <figure className={className} style={{ transform: `rotate(${rotate}deg)`, ...style }}>
      <div className="rounded-[3px] bg-cream-50 p-2 pb-9 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)]">
        <img src={src} alt="" className="aspect-[4/5] w-full object-cover" draggable={false} />
        {caption && <figcaption className="mt-1.5 truncate px-1 text-center font-hand text-[15px] text-ink-text">{caption}</figcaption>}
      </div>
    </figure>
  );
}

export function Heart({ size = 24, fill = "var(--rose-500)", ...p }: P & { fill?: string }) {
  return (
    <svg {...box(size, "0 0 24 24", p)}>
      <path d="M12 21c-7-4.6-10-8.3-10-12.2A5 5 0 0 1 12 6a5 5 0 0 1 10 2.8C22 12.7 19 16.4 12 21z" fill={fill} />
    </svg>
  );
}

export function Ornament({ size = 50, color = "#ff4d7e", ...p }: P & { color?: string }) {
  return (
    <svg {...box(size, "0 0 50 64", p)}>
      <defs><radialGradient id={`or${color.slice(1)}`} cx="35%" cy="35%"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.25" stopColor={color} /><stop offset="1" stopColor="#3b1f5c" /></radialGradient></defs>
      <line x1="25" y1="0" x2="25" y2="12" stroke="#ffc870" strokeOpacity="0.6" />
      <rect x="19" y="10" width="12" height="7" rx="2" fill="#ffc870" />
      <circle cx="25" cy="38" r="21" fill={`url(#or${color.slice(1)})`} />
      <path d="M8 36 Q25 44 42 36" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function Cake({ size = 200, name = "", ...p }: P & { name?: string }) {
  return (
    <svg {...box(size, "0 0 240 200", p)}>
      <defs>
        <linearGradient id="ck1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ffe4ec" /><stop offset="1" stopColor="#ffc2d1" /></linearGradient>
        <linearGradient id="ck2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff8ef" /><stop offset="1" stopColor="#f3e6d3" /></linearGradient>
      </defs>
      <ellipse cx="120" cy="186" rx="110" ry="12" fill="#000" opacity="0.35" />
      <rect x="20" y="110" width="200" height="72" rx="12" fill="url(#ck1)" />
      <path d="M20 122 q16.6 18 33.3 0 t33.3 0 t33.3 0 t33.3 0 t33.3 0 t33.3 0" fill="#ff7a9c" />
      <rect x="44" y="56" width="152" height="60" rx="12" fill="url(#ck2)" />
      <path d="M44 66 q12.6 14 25.3 0 t25.3 0 t25.3 0 t25.3 0 t25.3 0 t25.3 0" fill="#ffc870" opacity="0.9" />
      {name && <text x="120" y="160" textAnchor="middle" fontFamily="var(--font-kalam)" fontSize={name.length > 12 ? 16 : 22} fill="#d9305f">{name.slice(0, 18)}</text>}
    </svg>
  );
}

export function Diya({ size = 60, lit = true, ...p }: P & { lit?: boolean }) {
  return (
    <svg {...box(size, "0 0 80 60", p)} style={{ overflow: "visible", ...p.style }}>
      {lit && <circle cx="40" cy="18" r="22" fill="#ffc870" opacity="0.3" style={{ filter: "blur(6px)" }} />}
      <path d="M6 34 Q40 66 74 34 Z" fill="#c8693a" />
      <ellipse cx="40" cy="34" rx="34" ry="7" fill="#8a3f22" />
      {lit && <ellipse className="anim-flicker" cx="40" cy="20" rx="6" ry="13" fill="#ffe08a" />}
    </svg>
  );
}

export function GlobeOutline({ size = 300, ...p }: P) {
  return (
    <svg {...box(size, "0 0 200 200", p)}>
      <circle cx="100" cy="100" r="90" fill="none" stroke="#c9b6ff" strokeOpacity="0.35" />
      {[30, 60].map((r) => <ellipse key={r} cx="100" cy="100" rx={r} ry="90" fill="none" stroke="#c9b6ff" strokeOpacity="0.15" />)}
      {[-50, 0, 50].map((y) => <ellipse key={y} cx="100" cy={100 + y} rx={Math.sqrt(90 * 90 - y * y)} ry="10" fill="none" stroke="#c9b6ff" strokeOpacity="0.15" />)}
    </svg>
  );
}

export function Skyline({ className, fill = "#0b0714" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 400 80" preserveAspectRatio="none" className={className} aria-hidden>
      <path fill={fill} d="M0 80 V52 h14 V38 h10 v14 h12 V30 h8 v-8 h6 v8 h8 v28 h16 V44 h12 V20 l6 -8 6 8 v24 h14 V50 h10 V34 h16 v24 h12 V40 h8 v-6 h8 v6 h6 v24 h14 V28 h20 v34 h10 V46 h18 v16 h12 V36 h8 l4 -10 4 10 v30 h16 V50 h12 v12 h14 V42 h18 v24 h10 V54 h12 V80Z" />
    </svg>
  );
}

export function Teddy({ size = 90, ...p }: P) {
  return (
    <svg {...box(size, "0 0 100 100", p)}>
      <circle cx="28" cy="24" r="12" fill="#b07a5a" /><circle cx="72" cy="24" r="12" fill="#b07a5a" />
      <circle cx="28" cy="24" r="6" fill="#ffc2a8" /><circle cx="72" cy="24" r="6" fill="#ffc2a8" />
      <ellipse cx="50" cy="44" rx="30" ry="27" fill="#c48a66" />
      <ellipse cx="50" cy="82" rx="28" ry="20" fill="#c48a66" />
      <ellipse cx="50" cy="54" rx="12" ry="9" fill="#ffd8c2" />
      <circle cx="39" cy="40" r="3" fill="#2a1e1a" /><circle cx="61" cy="40" r="3" fill="#2a1e1a" />
      <ellipse cx="50" cy="50" rx="4" ry="3" fill="#2a1e1a" />
      <path d="M44 84c-4-3-6-5-6-7.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 2.5-2 4.5-6 7.5z" transform="translate(6 -2)" fill="#ff4d7e" />
    </svg>
  );
}

export function ChaiCup({ size = 70, ...p }: P) {
  return (
    <svg {...box(size, "0 0 80 80", p)}>
      <path d="M20 22 q4 -10 0 -18 M34 22 q4 -10 0 -18" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.5" fill="none" />
      <path d="M12 30 h48 l-5 38 q-1 6 -7 6 h-24 q-6 0 -7 -6z" fill="#fff8ef" />
      <ellipse cx="36" cy="30" rx="24" ry="5" fill="#b56a3c" />
      <path d="M60 38 q14 0 10 14 q-3 8 -12 8" stroke="#fff8ef" strokeWidth="5" fill="none" />
    </svg>
  );
}

export function Rose({ size = 70, ...p }: P) {
  return (
    <svg {...box(size, "0 0 80 120", p)}>
      <path d="M40 60 Q42 90 38 118" stroke="#3a7a4a" strokeWidth="3" fill="none" />
      <path d="M40 92 q-16 -6 -22 4 q14 6 22 -4z" fill="#4a9a5a" />
      <path d="M40 18 q-24 4 -22 26 q2 18 22 20 q20 -2 22 -20 q2 -22 -22 -26z" fill="#d9305f" />
      <path d="M40 24 q-14 4 -12 18 q8 10 12 2 q4 8 12 -2 q2 -14 -12 -18z" fill="#ff4d7e" />
      <path d="M34 34 q6 -6 12 0 q-6 6 -12 0z" fill="#ff7a9c" />
    </svg>
  );
}

export function Fireworks({ size = 120, ...p }: P) {
  return (
    <svg {...box(size, "0 0 120 120", p)}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={60 + Math.cos(a) * 14} y1={60 + Math.sin(a) * 14} x2={60 + Math.cos(a) * 46} y2={60 + Math.sin(a) * 46} stroke={i % 2 ? "#ffc870" : "#ff7a9c"} strokeWidth="2.5" strokeLinecap="round" />;
      })}
      <circle cx="60" cy="60" r="5" fill="#fff8ef" />
    </svg>
  );
}

export function SnowGlobeArt({ size = 120, ...p }: P) {
  return (
    <svg {...box(size, "0 0 120 140", p)}>
      <defs><radialGradient id="sga" cx="40%" cy="35%"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#c9b6ff" stopOpacity="0.08" /></radialGradient></defs>
      <circle cx="60" cy="58" r="50" fill="#1a0f2e" />
      <path d="M22 78 q38 -20 76 0 v10 h-76z" fill="#efe8ff" />
      <path d="M60 30 l14 30 h-28z M60 44 l18 32 h-36z" fill="#3a7a5a" />
      {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={20 + ((i * 37) % 80)} cy={18 + ((i * 23) % 60)} r="1.6" fill="#fff" />)}
      <circle cx="60" cy="58" r="50" fill="url(#sga)" stroke="#fff" strokeOpacity="0.3" />
      <path d="M24 104 h72 l8 26 h-88z" fill="#8a3f22" />
      <rect x="16" y="126" width="88" height="10" rx="3" fill="#6b2f1a" />
    </svg>
  );
}

export function Splash({ size = 120, ...p }: P) {
  return (
    <svg {...box(size, "0 0 120 120", p)}>
      <circle cx="50" cy="56" r="30" fill="#ff4d7e" opacity="0.85" /><circle cx="76" cy="46" r="22" fill="#ffc870" opacity="0.85" />
      <circle cx="70" cy="76" r="20" fill="#c9b6ff" opacity="0.85" /><circle cx="30" cy="30" r="6" fill="#ff8a65" /><circle cx="98" cy="88" r="5" fill="#ff4d7e" />
    </svg>
  );
}

export const OCCASION_ART: Record<string, (p: { size?: number }) => React.ReactElement> = {
  snowglobe: (p) => <SnowGlobeArt {...p} />,
  fireworks: (p) => <Fireworks {...p} />,
  cake: (p) => <Cake {...p} />,
  moon: (p) => <Moon {...p} />,
  rose: (p) => <Rose {...p} />,
  envelope: (p) => <Envelope {...p} />,
  polaroid: (p) => <Teddy {...p} />,
  lantern: (p) => <Lantern {...p} />,
  splash: (p) => <Splash {...p} />,
  thread: (p) => <Heart {...p} />,
  chai: (p) => <ChaiCup {...p} />,
};
