import type { CeremonyStyle, EventKind } from "@invites/content-schema";
import type { PRNG } from "@invites/renderer";
import { chhatri, cuspedArch, onionDome, pointedArch } from "./geometry";

/**
 * Chamber scenes for each function (360×420 art box, viewed through a cusped arch window).
 * `anim` builds the scroll-scrubbed timeline (progress 0..1); `ambient` is a pure function of time.
 */
export interface ChamberArt {
  svg: string;
  anim(tl: gsap.core.Timeline, el: HTMLElement): void;
  ambient?(el: HTMLElement, t: number): void;
  /** Audio bed while this chamber is on screen (sound on only). */
  bed?: "dholak";
}

const W = 360, H = 420;
const V = (n: string) => `var(--${n})`;
export const WINDOW = cuspedArch(16, 344, 92, 26, 420, 4, 0.32);

const wrap = (inner: string, defs = "") => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}<clipPath id="sm-win-clip"><path d="${WINDOW}"/></clipPath></defs><g clip-path="url(#sm-win-clip)">${inner}</g></svg>`;

const stars = (rng: PRNG, n: number, maxY: number) => Array.from({ length: n }, () => `<circle class="sm-tw" cx="${rng.range(10, 350).toFixed(1)}" cy="${rng.range(20, maxY).toFixed(1)}" r="${rng.range(0.5, 1.3).toFixed(2)}" fill="#fff" opacity=".7"/>`).join("");

const flicker = (t: number, seed: number) => 0.82 + 0.1 * Math.sin(t * 9.1 + seed) + 0.06 * Math.sin(t * 23.7 + seed * 2.3) + 0.04 * Math.sin(t * 3.3 + seed * 0.7);

const marigoldString = (y: number, sag: number, n = 24) => Array.from({ length: n }, (_, i) => {
  const u = i / (n - 1), x = 20 + u * 320, yy = y + Math.sin(u * Math.PI * 3) ** 2 * sag;
  return `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="${i % 2 ? "#F7B500" : V("marigold")}"/>`;
}).join("");

function haldi(): ChamberArt {
  const rays = Array.from({ length: 7 }, (_, i) => `<path d="M${-40 + i * 34},-20 L${30 + i * 46},440 L${60 + i * 46},440 L${-20 + i * 34},-20 Z" fill="#FFF7D0" opacity=".16"/>`).join("");
  const puff = Array.from({ length: 9 }, (_, i) => `<circle cx="${180 + Math.cos(i * 0.7) * 30 * (i % 3)}" cy="${300 - (i % 4) * 14}" r="${26 + (i % 3) * 10}" fill="#F4C430" opacity=".55"/>`).join("");
  const urli = (cx: number) => `<ellipse cx="${cx}" cy="372" rx="46" ry="10" fill="#7A4A12" opacity=".5"/><path d="M${cx - 44},352 Q${cx},398 ${cx + 44},352 Z" fill="url(#hb)"/><ellipse cx="${cx}" cy="352" rx="44" ry="9" fill="#E9A912"/><ellipse cx="${cx}" cy="351" rx="36" ry="6" fill="#F4C430"/>${[-20, -6, 10, 24].map((d) => `<circle cx="${cx + d}" cy="${349 + (d % 3)}" r="4" fill="${V("marigold")}"/>`).join("")}`;
  return {
    svg: wrap(`<rect width="360" height="420" fill="url(#hg)"/>
<g fill="${V("stone")}" opacity=".9"><path d="M0,120 H360 V330 H0 Z"/></g>
${[30, 135, 240].map((x) => `<path d="${pointedArch(x, 150, 90, 180, 54)}" fill="#C9822F" opacity=".55"/>`).join("")}
<g class="h-rays" style="transform-origin:0 0">${rays}</g>
<path d="M0,330 H360 V420 H0 Z" fill="#D89A3C"/>
${urli(96)}${urli(266)}
<g class="h-puff" style="transform-origin:180px 300px" filter="url(#hblur)">${puff}</g>
<g>${marigoldString(118, 18)}</g>`,
      `<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE8A0"/><stop offset="1" stop-color="#F2A93B"/></linearGradient>
<linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4B866"/><stop offset="1" stop-color="#7A4A12"/></linearGradient>
<filter id="hblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>`),
    anim(tl, el) {
      tl.fromTo(el.querySelector(".h-rays"), { y: 40, opacity: 0.4, rotate: -4 }, { y: -30, opacity: 1, rotate: 2, ease: "none", duration: 1 }, 0);
      tl.fromTo(el.querySelector(".h-puff"), { scale: 0.2, opacity: 0 }, { scale: 1.5, opacity: 0.9, duration: 0.5, ease: "power2.out" }, 0.35)
        .to(el.querySelector(".h-puff"), { opacity: 0, scale: 1.9, duration: 0.3, ease: "power1.in" }, 0.75);
    },
  };
}

function mehendi(): ChamberArt {
  const vine = "M30,410 C30,330 20,260 40,200 C60,140 90,96 140,70 C170,56 190,56 220,70 C270,96 300,140 320,200 C340,260 330,330 330,410";
  const buds = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.94];
  const paisley = (i: number) => `<g class="m-bud" data-u="${buds[i]}"><path d="M0,0 C8,-10 18,-4 14,6 C10,14 -2,14 -4,6 C-5,2 -3,0 0,0 Z" fill="#B5562B"/><circle cx="6" cy="3" r="2" fill="#FBE3C4"/></g>`;
  return {
    svg: wrap(`<rect width="360" height="420" fill="url(#mg)"/>
<g fill="#24563A" opacity=".8">${[20, 70, 280, 330].map((x, i) => `<ellipse cx="${x}" cy="${300 + (i % 2) * 20}" rx="44" ry="80"/>`).join("")}</g>
<g transform="translate(180 0)">
 <path d="${onionDome(0, 150, 120, 70)}" fill="${V("stone-dark")}"/>
 <path d="M-90,150 H90 L78,170 H-78 Z" fill="${V("stone")}"/>
 <path d="${pointedArch(-70, 170, 140, 150, 70)}" fill="${V("stone")}"/>
 <path d="${pointedArch(-56, 184, 112, 136, 56)}" fill="#1E3A2A"/>
 <g fill="${V("window")}" opacity=".35">${Array.from({ length: 6 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<path d="M${-44 + c * 22},${236 + r * 14} l7,7 l-7,7 l-7,-7 Z"/>`).join("")).join("")}</g>
 <path d="M-80,320 H80 L64,346 H-64 Z" fill="${V("stone-dark")}"/>
 ${[-60, -30, 0, 30, 60].map((x) => `<path d="M${x - 5},346 l5,22 l5,-22 Z" fill="${V("stone-dark")}"/>`).join("")}
</g>
<path d="M0,380 H360 V420 H0 Z" fill="#1E4A31"/>
<path class="m-vine" d="${vine}" pathLength="1" fill="none" stroke="#B5562B" stroke-width="4" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>
<path class="m-vine2" d="${vine}" pathLength="1" fill="none" stroke="#FBE3C4" stroke-width="1" stroke-dasharray=".01 .03" stroke-dashoffset="1" opacity="0"/>
${buds.map((_, i) => paisley(i)).join("")}`,
      `<linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8CF8A"/><stop offset="1" stop-color="#2E6B45"/></linearGradient>`),
    anim(tl, el) {
      const vine = el.querySelector<SVGPathElement>(".m-vine")!;
      tl.fromTo(vine, { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, ease: "none", duration: 0.9 }, 0);
      tl.to(el.querySelector(".m-vine2"), { opacity: 0.9, duration: 0.2 }, 0.8);
      const len = vine.getTotalLength ? vine.getTotalLength() : 0;
      el.querySelectorAll<SVGGElement>(".m-bud").forEach((b) => {
        const u = Number(b.dataset.u);
        const p = len && vine.getPointAtLength ? vine.getPointAtLength(u * len) : { x: 180, y: 200 };
        b.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        tl.fromTo(b, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.08, ease: "back.out(3)" }, u * 0.9);
      });
    },
  };
}

function sangeet(rng: PRNG): ChamberArt {
  const chandelier = (cx: number, i: number) => `<g class="s-ch" data-i="${i}">
<line x1="${cx}" y1="0" x2="${cx}" y2="70" stroke="${V("brass")}" stroke-width="1.2"/>
<circle class="s-glow" cx="${cx}" cy="96" r="58" fill="url(#sglow)" opacity="0"/>
<path d="M${cx - 30},90 Q${cx},112 ${cx + 30},90 L${cx + 20},80 Q${cx},92 ${cx - 20},80 Z" fill="${V("brass")}"/>
<path d="M${cx - 18},106 Q${cx},120 ${cx + 18},106 L${cx},132 Z" fill="${V("mirror")}" opacity=".6"/>
${[-28, -14, 0, 14, 28].map((d) => `<path class="s-flame" d="M${cx + d},${78 - Math.abs(d) * 0.1} q2,-5 0,-9 q-2,4 0,9 Z" fill="#FFD27A" opacity=".25"/>`).join("")}
</g>`;
  /** Dancer shadows built from parts: 4 poses per dancer, played as an 8 fps sprite loop. */
  const limb = (x: number, y: number, len: number, deg: number, _w: number) => {
    const a = (deg * Math.PI) / 180;
    return `M${x.toFixed(1)},${y.toFixed(1)} L${(x + Math.sin(a) * len).toFixed(1)},${(y + Math.cos(a) * len).toFixed(1)}`;
  };
  const figure = (x: number, female: boolean, arms: [number, number, number, number], hip: number, k: number) => {
    const sh = 248, hipY = 286;
    const [la, lf, ra, rf] = arms;
    const elbowL = { x: x - 10 + Math.sin((la * Math.PI) / 180) * 20, y: sh + Math.cos((la * Math.PI) / 180) * 20 };
    const elbowR = { x: x + 10 + Math.sin((ra * Math.PI) / 180) * 20, y: sh + Math.cos((ra * Math.PI) / 180) * 20 };
    const armPath = [limb(x - 10, sh, 20, la, 0), limb(elbowL.x, elbowL.y, 18, lf, 0), limb(x + 10, sh, 20, ra, 0), limb(elbowR.x, elbowR.y, 18, rf, 0)].join(" ");
    const body = female
      ? `<path d="M${x - 11},${sh - 2} Q${x},${sh - 6} ${x + 11},${sh - 2} L${x + 8},${hipY - 8} L${x + 34 + hip},${hipY + 56} Q${x},${hipY + 66} ${x - 34 + hip},${hipY + 56} L${x - 8},${hipY - 8} Z"/><path d="M${x + 6},${sh - 10} q30,10 22,60" fill="none" stroke="#0A0B22" stroke-width="3"/>`
      : `<path d="M${x - 12},${sh - 2} Q${x},${sh - 6} ${x + 12},${sh - 2} L${x + 12},${hipY + 20} L${x - 12},${hipY + 20} Z"/><path d="${limb(x - 6, hipY + 18, 44, 8 + hip * 0.6, 0)} ${limb(x + 6, hipY + 18, 44, -14 + hip * 0.4, 0)}" fill="none" stroke="#0A0B22" stroke-width="9" stroke-linecap="round"/>`;
    const head = `<circle cx="${x + hip * 0.2}" cy="${sh - 16}" r="9.5"/>` + (female ? `<path d="M${x - 6},${sh - 22} q-10,16 -4,30" fill="none" stroke="#0A0B22" stroke-width="5" stroke-linecap="round"/>` : `<path d="M${x - 10},${sh - 22} q10,-10 20,0 z"/>`);
    return `<g class="s-pose s-pose-${k}" fill="#0A0B22" opacity="${k === 0 ? 0.78 : 0}">${head}${body}<path d="${armPath}" fill="none" stroke="#0A0B22" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  };
  const posesF: [number, number, number, number][] = [[200, 160, 160, 200], [150, 210, 210, 150], [220, 180, 120, 100], [130, 170, 230, 250]];
  const posesM: [number, number, number, number][] = [[210, 200, 150, 160], [160, 180, 200, 190], [200, 230, 140, 110], [140, 120, 220, 240]];
  const pose = (k: number) => figure(132, true, posesF[k]!, [0, 6, -4, 3][k]!, k) + figure(232, false, posesM[k]!, [0, -6, 5, -3][k]!, k);
  return {
    bed: "dholak",
    svg: wrap(`<rect width="360" height="420" fill="url(#sg)"/>
${[0, 1, 2, 3].map((i) => `<path d="${pointedArch(8 + i * 88, 150, 80, 250, 60)}" fill="#0F1540" opacity=".6"/>`).join("")}
${[0, 1, 2, 3, 4].map((i) => `<rect x="${2 + i * 88}" y="150" width="12" height="270" fill="${V("stone-shadow")}" opacity=".9"/>`).join("")}
<rect x="0" y="258" width="360" height="110" fill="#3A2A6A" opacity=".35"/>
<g class="s-dancers">${[0, 1, 2, 3].map((k) => pose(k)).join("")}</g>
<path d="M0,368 H360 V420 H0 Z" fill="#1A1740"/>
${stars(rng, 0, 0)}
${chandelier(80, 0)}${chandelier(180, 1)}${chandelier(280, 2)}`,
      `<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2160"/><stop offset="1" stop-color="#3B2470"/></linearGradient>
<radialGradient id="sglow"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFB84A" stop-opacity="0"/></radialGradient>`),
    anim(tl, el) {
      el.querySelectorAll(".s-ch").forEach((c, i) => {
        tl.to(c.querySelector(".s-glow"), { opacity: 0.85, duration: 0.18 }, 0.1 + i * 0.28);
        tl.to(c.querySelectorAll(".s-flame"), { opacity: 1, duration: 0.12, stagger: 0.02 }, 0.1 + i * 0.28);
      });
    },
    ambient(el, t) {
      const frame = Math.floor(t * 8) % 4; // sprite loop at 8 fps
      el.querySelectorAll<SVGGElement>(".s-pose").forEach((p) => p.setAttribute("opacity", p.classList.contains(`s-pose-${frame}`) ? "0.78" : "0"));
    },
  };
}

function cocktail(rng: PRNG): ChamberArt {
  const tiles = Array.from({ length: 120 }, () => `<rect class="c-tile" x="${rng.range(0, 360).toFixed(0)}" y="${rng.range(0, 260).toFixed(0)}" width="6" height="6" transform="rotate(45)" fill="${V("mirror")}" opacity="${rng.range(0.1, 0.5).toFixed(2)}"/>`).join("");
  const candle = (x: number, i: number) => `<rect x="${x - 4}" y="300" width="8" height="26" fill="#FBF0DA"/><path class="c-flame" data-i="${i}" style="transform-origin:${x}px 300px" d="M${x},284 q5,9 0,16 q-5,-7 0,-16 Z" fill="#FFC33D"/><circle class="c-glow" data-i="${i}" cx="${x}" cy="292" r="22" fill="url(#cglow)"/>`;
  return {
    svg: wrap(`<rect width="360" height="420" fill="#120F2A"/><g transform="translate(180 -140)">${tiles}</g>
<path d="M0,326 H360 V420 H0 Z" fill="#2A1A20"/><rect x="0" y="322" width="360" height="6" fill="${V("brass")}"/>
${[60, 120, 180, 240, 300].map((x, i) => candle(x, i)).join("")}`,
      `<radialGradient id="cglow"><stop offset="0" stop-color="#FFD27A" stop-opacity=".6"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>`),
    anim(tl, el) { tl.fromTo(el.querySelectorAll(".c-tile"), { opacity: 0.1 }, { opacity: 0.6, stagger: { each: 0.004, from: "random" }, duration: 0.2 }, 0); },
    ambient(el, t) {
      el.querySelectorAll<SVGElement>(".c-flame").forEach((f) => { const i = Number(f.dataset.i); f.style.transform = `scaleY(${flicker(t, i * 1.7).toFixed(3)})`; });
      el.querySelectorAll<SVGElement>(".c-glow").forEach((g) => g.setAttribute("opacity", flicker(t, Number(g.dataset.i)).toFixed(2)));
    },
  };
}

function wedding(rng: PRNG, style: CeremonyStyle): ChamberArt {
  const sky = `<rect width="360" height="420" fill="url(#wg)"/>${stars(rng, 50, 200)}`;
  const lampsAt = (pts: [number, number][]) => pts.map(([x, y], i) => `<g class="w-lamp" data-i="${i}"><circle class="w-lglow" cx="${x}" cy="${y - 4}" r="16" fill="url(#wlg)" opacity="0"/><path d="M${x - 7},${y} q7,7 14,0 Z" fill="${V("brass")}"/><path class="w-lflame" d="M${x},${y - 11} q3,6 0,10 q-3,-4 0,-10 Z" fill="#FFC33D" opacity="0"/></g>`).join("");
  const defs = `<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D1238"/><stop offset=".7" style="stop-color:${V("sky2")}"/><stop offset="1" stop-color="#4A2A4A"/></linearGradient>
<radialGradient id="wlg"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFB84A" stop-opacity="0"/></radialGradient>
<radialGradient id="wfire"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".4" stop-color="#FFB12A"/><stop offset="1" stop-color="#E0480F" stop-opacity="0"/></radialGradient>`;
  const ground = `<path d="M0,330 H360 V420 H0 Z" fill="#2A1830"/>`;
  const drapes = `<path d="M70,150 Q125,190 180,150 Q235,190 290,150" fill="none" stroke="${V("accent")}" stroke-width="7" opacity=".9"/><path d="M70,160 Q125,196 180,160 Q235,196 290,160" fill="none" stroke="${V("marigold")}" stroke-width="4"/>`;
  if (style === "anand-karaj") {
    const pts: [number, number][] = [[110, 330], [250, 330], [250, 380], [110, 380]];
    return {
      svg: wrap(`${sky}${ground}
<path d="M120,320 V230 H240 V320" fill="none" stroke="${V("stone")}" stroke-width="6"/>
<path d="${onionDome(180, 230, 140, 70)}" fill="${V("stone")}"/>
<path d="M130,240 Q180,270 230,240" fill="none" stroke="${V("marigold")}" stroke-width="5"/>
<rect x="140" y="290" width="80" height="30" rx="4" fill="${V("accent")}" opacity=".85"/>
<path d="M150,290 Q180,268 210,290 Z" fill="#F3E9FF" opacity=".9"/>
${lampsAt(pts)}`, defs),
      anim(tl, el) { el.querySelectorAll(".w-lamp").forEach((l, i) => { tl.to(l.querySelector(".w-lglow"), { opacity: 1, duration: 0.12 }, 0.15 + i * 0.2); tl.to(l.querySelector(".w-lflame"), { opacity: 1, duration: 0.08 }, 0.15 + i * 0.2); }); },
    };
  }
  if (style === "nikah" || style === "walima") {
    const lantern = (x: number, len: number, i: number) => `<g class="w-lan" data-i="${i}" style="transform-origin:${x}px 0"><line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="${V("brass")}"/><path d="M${x - 9},${len} h18 l-3,26 h-12 Z" fill="${V("brass")}"/><rect class="w-lanlight" x="${x - 6}" y="${len + 4}" width="12" height="18" fill="#FFD27A" opacity=".2"/><path d="M${x - 6},${len} q6,-10 12,0 Z" fill="${V("brass")}"/></g>`;
    return {
      svg: wrap(`${sky}<path d="M290,70 a26,26 0 1,0 18,44 a20,20 0 1,1 -18,-44 Z" fill="#FFF3D6"/>${ground}
${[60, 110, 160, 210, 260, 310].map((x, i) => lantern(x, 60 + (i % 3) * 40, i)).join("")}
<path d="${cuspedArch(110, 250, 270, 220, 330, 3, 0.32)}" fill="none" stroke="${V("stone")}" stroke-width="6"/>
<rect x="130" y="300" width="100" height="30" rx="6" fill="${V("accent")}" opacity=".8"/>`, defs),
      anim(tl, el) { el.querySelectorAll(".w-lanlight").forEach((l, i) => tl.to(l, { opacity: 1, duration: 0.1 }, 0.1 + i * 0.12)); },
      ambient(el, t) { el.querySelectorAll<SVGGElement>(".w-lan").forEach((l) => { const i = Number(l.dataset.i); l.style.transform = `rotate(${(Math.sin(t * 1.1 + i) * 2).toFixed(2)}deg)`; }); },
    };
  }
  if (style === "church") {
    const cand = (x: number, h: number, i: number) => `<g class="w-lamp" data-i="${i}"><rect x="${x - 3}" y="${330 - h}" width="6" height="${h}" fill="#FBF0DA"/><circle class="w-lglow" cx="${x}" cy="${322 - h}" r="14" fill="url(#wlg)" opacity="0"/><path class="w-lflame" d="M${x},${318 - h} q3,6 0,10 q-3,-4 0,-10 Z" fill="#FFC33D" opacity="0"/></g>`;
    return {
      svg: wrap(`<rect width="360" height="420" fill="#2B2440"/><path d="M90,330 V170 Q180,60 270,170 V330" fill="#3E3560"/>
<path d="M120,330 V180 Q180,100 240,180 V330" fill="#7FA6D6" opacity=".25"/>
<path d="M180,112 V300 M120,190 H240" stroke="#9FC0E6" stroke-width="2" opacity=".35"/>
<path d="M0,330 H360 V420 H0 Z" fill="#1C1730"/>
${[60, 90, 270, 300, 120, 240].map((x, i) => cand(x, 40 + (i % 2) * 24, i)).join("")}`, defs),
      anim(tl, el) { el.querySelectorAll(".w-lamp").forEach((l, i) => { tl.to(l.querySelector(".w-lglow"), { opacity: 1, duration: 0.1 }, 0.1 + i * 0.13); tl.to(l.querySelector(".w-lflame"), { opacity: 1, duration: 0.08 }, 0.1 + i * 0.13); }); },
    };
  }
  // Hindu (north/south), Jain, secular, interfaith: mandap with agni and seven lamps (saat phere).
  const seven: [number, number][] = Array.from({ length: 7 }, (_, i) => { const u = i / 6; return [70 + u * 220, 400 - Math.sin(u * Math.PI) * 36]; });
  return {
    svg: wrap(`${sky}${ground}
<g fill="${V("stone")}">${[76, 120, 240, 284].map((x, i) => `<rect x="${x - 5}" y="${150 + (i === 1 || i === 2 ? 14 : 0)}" width="10" height="${180 - (i === 1 || i === 2 ? 14 : 0)}"/>`).join("")}</g>
<path d="M60,150 H300 L280,128 H80 Z" fill="${V("stone-dark")}"/>
<path d="${onionDome(180, 128, 130, 56)}" fill="${V("stone")}"/>
${drapes}
${[76, 284].map((x) => Array.from({ length: 14 }, (_, i) => `<circle cx="${x}" cy="${160 + i * 11}" r="4" fill="${i % 2 ? "#F7B500" : V("marigold")}"/>`).join("")).join("")}
<rect x="156" y="300" width="48" height="22" fill="#8A3B22"/><rect x="150" y="318" width="60" height="12" fill="#6B2A18"/>
<circle class="w-fireglow" cx="180" cy="290" r="44" fill="url(#wfire)" opacity=".7"/>
<g class="w-fire" style="transform-origin:180px 302px"><path d="M180,262 C192,280 196,292 180,302 C164,292 168,280 180,262 Z" fill="#FFB12A"/><path d="M180,278 C186,288 186,294 180,300 C174,294 174,288 180,278 Z" fill="#FFF3C4"/></g>
${lampsAt(seven)}`, defs),
    anim(tl, el) { el.querySelectorAll(".w-lamp").forEach((l, i) => { tl.to(l.querySelector(".w-lglow"), { opacity: 1, duration: 0.08 }, 0.08 + i * 0.12); tl.to(l.querySelector(".w-lflame"), { opacity: 1, duration: 0.06 }, 0.08 + i * 0.12); }); },
    ambient(el, t) {
      const f = el.querySelector<SVGGElement>(".w-fire");
      if (f) f.style.transform = `scale(${(0.92 + 0.08 * flicker(t, 1)).toFixed(3)}, ${flicker(t, 2.2).toFixed(3)}) skewX(${(Math.sin(t * 5.3) * 4).toFixed(2)}deg)`;
      el.querySelector(".w-fireglow")?.setAttribute("opacity", (0.55 + 0.25 * flicker(t, 4)).toFixed(2));
    },
  };
}

function reception(rng: PRNG): ChamberArt {
  const city = Array.from({ length: 140 }, (_, i) => `<circle class="r-city" data-i="${i}" cx="${rng.range(0, 360).toFixed(1)}" cy="${rng.range(300, 410).toFixed(1)}" r="${rng.range(0.6, 1.6).toFixed(2)}" fill="${rng() > 0.7 ? "#FFE6A8" : "#FFC76B"}"/>`).join("");
  const fairy = Array.from({ length: 30 }, (_, i) => { const u = i / 29; return `<circle cx="${(20 + u * 320).toFixed(1)}" cy="${(140 + Math.sin(u * Math.PI) * 34).toFixed(1)}" r="1.8" fill="#FFF1C2"/>`; }).join("");
  return {
    svg: wrap(`<rect width="360" height="420" fill="url(#rg)"/>${stars(rng, 40, 160)}
<path d="M0,300 Q90,290 180,298 T360,296 V420 H0 Z" fill="#141433"/>${city}
<g class="r-fairy">${fairy}</g>
<path d="${chhatri(36, 300, 70)}" fill="${V("stone-shadow")}"/><path d="${chhatri(324, 300, 70)}" fill="${V("stone-shadow")}"/>
<path d="M0,300 H360 V312 H0 Z" fill="${V("stone-dark")}"/>`,
      `<linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0F33"/><stop offset="1" style="stop-color:${V("sky2")}"/></linearGradient>`),
    anim(tl, el) { tl.fromTo(el.querySelectorAll(".r-city"), { opacity: 0 }, { opacity: 1, stagger: { each: 0.004, from: "random" }, duration: 0.1 }, 0); tl.fromTo(el.querySelector(".r-fairy"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5); },
    ambient(el, t) { el.querySelectorAll<SVGCircleElement>(".r-city").forEach((c, i) => { if (i % 4 === 0) c.style.opacity = (0.5 + 0.5 * Math.sin(t * 2 + i)).toFixed(2); }); },
  };
}

function custom(): ChamberArt {
  const diyas = Array.from({ length: 9 }, (_, i) => { const x = 40 + i * 35; return `<g class="x-diya" data-i="${i}"><circle class="x-glow" cx="${x}" cy="350" r="18" fill="url(#xglow)" opacity="0"/><path d="M${x - 9},356 q9,9 18,0 Z" fill="${V("brass")}"/><path class="x-flame" d="M${x},340 q4,7 0,13 q-4,-6 0,-13 Z" fill="#FFC33D" opacity="0"/></g>`; }).join("");
  return {
    svg: wrap(`<rect width="360" height="420" fill="url(#xg)"/>
${[20, 130, 240].map((x) => `<path d="${pointedArch(x, 140, 100, 200, 60)}" fill="${V("stone-shadow")}" opacity=".5"/>`).join("")}
<path d="M0,340 H360 V420 H0 Z" fill="${V("stone-dark")}"/>${diyas}`,
      `<linearGradient id="xg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${V("sky2")}"/><stop offset="1" style="stop-color:${V("horizon")}"/></linearGradient>
<radialGradient id="xglow"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFB84A" stop-opacity="0"/></radialGradient>`),
    anim(tl, el) { el.querySelectorAll(".x-diya").forEach((d, i) => { tl.to(d.querySelector(".x-glow"), { opacity: 1, duration: 0.08 }, i * 0.09); tl.to(d.querySelector(".x-flame"), { opacity: 1, duration: 0.06 }, i * 0.09); }); },
  };
}

export function chamberArt(kind: EventKind, style: CeremonyStyle, rng: PRNG): ChamberArt {
  switch (kind) {
    case "haldi": return haldi();
    case "mehendi": return mehendi();
    case "sangeet": return sangeet(rng);
    case "cocktail": return cocktail(rng);
    case "wedding": return wedding(rng, style);
    case "reception": return reception(rng);
    default: return custom();
  }
}

/** Sandstone frame drawn over the chamber window. */
export function chamberFrameSvg(): string {
  const outer = cuspedArch(6, 354, 86, 14, 420, 4, 0.32);
  return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><mask id="sm-cf"><rect width="360" height="420" fill="#fff"/><path d="${WINDOW}" fill="#000"/></mask>
<linearGradient id="sm-cfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--stone)"/><stop offset="1" style="stop-color:var(--stone-dark)"/></linearGradient></defs>
<g mask="url(#sm-cf)"><rect width="360" height="420" fill="var(--backdrop)"/><path d="${outer}" fill="url(#sm-cfg)"/></g>
<path d="${WINDOW}" fill="none" stroke="var(--stone-shadow)" stroke-width="2" opacity=".6"/></svg>`;
}
