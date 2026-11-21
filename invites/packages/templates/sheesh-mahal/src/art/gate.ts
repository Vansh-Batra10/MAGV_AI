import type { PRNG } from "@invites/renderer";
import { chhatri, cuspedArch, merlons, onionDome, pointedArch } from "./geometry";

/** Gate scene art, procedural, drawn in a 360×740 scene. Colours come from pack tokens (CSS vars). */

export const ARCH = { x0: 80, x1: 280, spring: 312, apex: 248, bottom: 706 } as const;
export const archPath = () => cuspedArch(ARCH.x0, ARCH.x1, ARCH.spring, ARCH.apex, ARCH.bottom, 4, 0.32);

const V = (n: string) => `var(--${n})`;

export function skySvg(rng: PRNG, starCount: number): string {
  const stars = Array.from({ length: starCount }, (_, i) => {
    const x = rng.range(4, 356), y = Math.pow(rng(), 1.6) * 300 + 6, r = rng.range(0.4, 1.35);
    return `<circle class="sm-star" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.35 + rng() * 0.6).toFixed(2)}"/>`;
  }).join("");
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true">
<defs>
 <linearGradient id="sm-sky-g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" style="stop-color:${V("sky")}"/><stop offset=".42" style="stop-color:${V("sky2")}"/>
  <stop offset=".62" style="stop-color:${V("horizon")}"/><stop offset=".8" style="stop-color:${V("glow")};stop-opacity:.85"/>
 </linearGradient>
 <radialGradient id="sm-moon-glow"><stop offset="0" stop-color="#fff6dd" stop-opacity=".55"/><stop offset="1" stop-color="#fff6dd" stop-opacity="0"/></radialGradient>
 <mask id="sm-crescent"><circle cx="292" cy="92" r="15" fill="#fff"/><circle cx="299" cy="86" r="13.5" fill="#000"/></mask>
</defs>
<rect width="360" height="740" fill="url(#sm-sky-g)"/>
<circle cx="292" cy="92" r="46" fill="url(#sm-moon-glow)"/>
<circle cx="292" cy="92" r="15" fill="#FFF3D6" mask="url(#sm-crescent)"/>
<g class="sm-stars">${stars}</g>
</svg>`;
}

/** Palace skyline behind the gateway, with lit jharokha windows that flicker. */
export function palaceSvg(rng: PRNG, bulbs: boolean): string {
  const domes = [
    chhatri(22, 232, 26), chhatri(338, 232, 26),
    chhatri(112, 214, 22), chhatri(248, 214, 22),
    onionDome(180, 132, 82, 92),
  ];
  // Central dome drum + side wings.
  const body = [
    "M0,232 H70 V214 H154 V132 H206 V214 H290 V232 H360 V740 H0 Z",
    "M160,132 h40 v-6 h-40 Z",
  ];
  const windows: string[] = [];
  let wi = 0;
  for (const [y, h] of [[246, 20], [280, 16]] as const) {
    for (let x = 6; x < 354; x += 21) {
      if (x > 56 && x < 296 && y > 240) continue; // hidden behind the gateway anyway
      windows.push(`<path class="sm-win" data-i="${wi++}" d="${pointedArch(x, y, 9, h, 7)}" fill="${V("window")}" opacity="${(0.55 + rng() * 0.4).toFixed(2)}"/>`);
    }
  }
  for (let x = 162; x < 200; x += 13) windows.push(`<path class="sm-win" data-i="${wi++}" d="${pointedArch(x, 150, 8, 18, 6)}" fill="${V("window")}" opacity=".8"/>`);
  for (const x of [104, 116, 240, 252]) windows.push(`<path class="sm-win" data-i="${wi++}" d="${pointedArch(x, 196, 6, 12, 5)}" fill="${V("window")}" opacity=".7"/>`);
  const bulbRow = bulbs
    ? Array.from({ length: 60 }, (_, i) => { const x = 3 + i * 6; return `<circle class="sm-bulb" cx="${x}" cy="231" r="1.1" fill="#FFE7A3"/>`; }).join("") +
      Array.from({ length: 14 }, (_, i) => `<circle class="sm-bulb" cx="${154 + i * 4}" cy="131" r="1" fill="#FFE7A3"/>`).join("")
    : "";
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true">
<defs>
 <linearGradient id="sm-pal-g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" style="stop-color:${V("stone-shadow")}"/><stop offset=".35" style="stop-color:${V("sky2")}"/>
 </linearGradient>
 <linearGradient id="sm-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" style="stop-color:${V("glow")}" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<g fill="url(#sm-pal-g)">${[...domes, ...body].map((d) => `<path d="${d}"/>`).join("")}</g>
<path d="${domes[4]}" fill="none" stroke="url(#sm-rim)" stroke-width="1.2"/>
<g class="sm-windows">${windows.join("")}</g>
${bulbRow}
</svg>`;
}

/** The gateway (pol): pylons with chhatris, frieze, lintel, carved arch frame. Doors are separate. */
export function gatewaySvg(): string {
  const arch = archPath();
  const frieze = Array.from({ length: 11 }, (_, i) => {
    const x = 47 + i * 24.2;
    return `<path d="${pointedArch(x, 138, 14, 22, 9)}" fill="${V("stone-shadow")}" opacity=".55"/>`;
  }).join("");
  const jaaliCells: string[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 3; c++) {
    const x = 40 + c * 10, y = 380 + r * 12;
    jaaliCells.push(`<path d="M${x + 5},${y} l5,6 l-5,6 l-5,-6 Z"/>`);
  }
  const jaaliL = jaaliCells.join("");
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true">
<defs>
 <linearGradient id="sm-stone-g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" style="stop-color:${V("stone")}"/><stop offset=".55" style="stop-color:${V("stone-dark")}"/><stop offset="1" style="stop-color:${V("stone-shadow")}"/>
 </linearGradient>
 <linearGradient id="sm-stone-side" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
 </linearGradient>
 <radialGradient id="sm-dusk-light" cx=".5" cy=".62" r=".7"><stop offset="0" style="stop-color:${V("glow")}" stop-opacity=".28"/><stop offset="1" style="stop-color:${V("glow")}" stop-opacity="0"/></radialGradient>
 <mask id="sm-arch-hole"><rect width="360" height="740" fill="#fff"/><path d="${arch}" fill="#000"/></mask>
</defs>
<g mask="url(#sm-arch-hole)">
 <path d="M0,330 H30 V112 H76 V138 H284 V112 H330 V330 H360 V740 H0 Z" fill="url(#sm-stone-g)"/>
 <path d="M0,330 H30 V112 H76 V138 H284 V112 H330 V330 H360 V740 H0 Z" fill="url(#sm-stone-side)"/>
 <path d="M0,330 H360 V740 H0 Z" fill="url(#sm-dusk-light)"/>
 <path d="${merlons(31, 76, 112, 8, 9)} ${merlons(285, 330, 112, 8, 9)} ${merlons(78, 284, 138, 9, 10)}" fill="${V("stone")}"/>
 <path d="${chhatri(53, 104, 40)}" fill="${V("stone-dark")}"/>
 <path d="${chhatri(307, 104, 40)}" fill="${V("stone-dark")}"/>
 ${frieze}
 <rect x="30" y="166" width="300" height="5" fill="${V("stone-shadow")}" opacity=".5"/>
 <!-- carved frame around the opening -->
 <path d="${cuspedArchFrame()}" fill="none" stroke="${V("stone-shadow")}" stroke-width="10" opacity=".35"/>
 <path d="${arch}" fill="none" stroke="${V("stone")}" stroke-width="3" transform="translate(0,-4)" opacity=".9"/>
 <!-- spandrel medallions -->
 <circle cx="104" cy="262" r="11" fill="none" stroke="${V("stone-shadow")}" stroke-width="2" opacity=".55"/>
 <circle cx="256" cy="262" r="11" fill="none" stroke="${V("stone-shadow")}" stroke-width="2" opacity=".55"/>
 <path d="M104,253 l3,6 l6,3 l-6,3 l-3,6 l-3,-6 l-6,-3 l6,-3 Z M256,253 l3,6 l6,3 l-6,3 l-3,6 l-3,-6 l-6,-3 l6,-3 Z" fill="${V("stone-shadow")}" opacity=".55"/>
 <!-- pillars -->
 <rect x="66" y="300" width="12" height="404" fill="${V("stone")}"/><rect x="282" y="300" width="12" height="404" fill="${V("stone")}"/>
 <rect x="62" y="296" width="20" height="8" rx="2" fill="${V("stone-dark")}"/><rect x="278" y="296" width="20" height="8" rx="2" fill="${V("stone-dark")}"/>
 <rect x="62" y="690" width="20" height="16" rx="2" fill="${V("stone-dark")}"/><rect x="278" y="690" width="20" height="16" rx="2" fill="${V("stone-dark")}"/>
 <!-- side jaali windows -->
 <path d="${pointedArch(36, 360, 32, 130, 24)}" fill="${V("stone-shadow")}" opacity=".8"/>
 <g fill="${V("window")}" opacity=".75" class="sm-jaali">${jaaliL}</g>
 <path d="${pointedArch(292, 360, 32, 130, 24)}" fill="${V("stone-shadow")}" opacity=".8"/>
 <g fill="${V("window")}" opacity=".75" class="sm-jaali" transform="translate(256,0)">${jaaliL}</g>
 <!-- floor / threshold -->
 <path d="M0,706 H360 V740 H0 Z" fill="${V("stone-shadow")}"/>
 <path d="M60,706 H300 L312,716 H48 Z" fill="${V("stone-dark")}"/>
</g>
</svg>`;
}

function cuspedArchFrame(): string {
  return cuspedArch(ARCH.x0 - 9, ARCH.x1 + 9, ARCH.spring - 6, ARCH.apex - 12, ARCH.bottom, 4, 0.32);
}

/** One door leaf, drawn in scene coordinates and clipped to its half of the arch. */
export function doorSvg(side: "left" | "right"): string {
  const { x0, x1, apex, bottom } = ARCH;
  const mid = (x0 + x1) / 2;
  const lx = side === "left" ? x0 : mid;
  const w = mid - x0;
  const clipId = `sm-door-clip-${side}`;
  const studs: string[] = [];
  for (const y of [376, 540, 692]) for (let x = lx + 8; x <= lx + w - 6; x += 9.3) studs.push(`<circle cx="${x.toFixed(1)}" cy="${y}" r="2.3"/>`);
  for (let y = 320; y < 700; y += 14) { studs.push(`<circle cx="${lx + 6}" cy="${y}" r="1.8"/>`); studs.push(`<circle cx="${lx + w - 6}" cy="${y}" r="1.8"/>`); }
  const meetX = side === "left" ? lx + w : lx;
  const knockX = side === "left" ? lx + w - 16 : lx + 16;
  const panel = (y: number, h: number) => `<rect x="${lx + 14}" y="${y}" width="${w - 28}" height="${h}" rx="3" fill="none" stroke="${V("wood-dark")}" stroke-width="3"/><rect x="${lx + 18}" y="${y + 4}" width="${w - 36}" height="${h - 8}" rx="2" fill="#000" opacity=".14"/>`;
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI + (i / 8) * Math.PI;
    const cx = side === "left" ? lx + w : lx;
    return `<line x1="${cx}" y1="356" x2="${(cx + Math.cos(a) * (side === "left" ? 1 : -1) * 70).toFixed(1)}" y2="${(356 + Math.sin(a) * 70).toFixed(1)}"/>`;
  }).join("");
  return `<svg viewBox="${lx} 0 ${w} 740" preserveAspectRatio="none" aria-hidden="true" style="overflow:visible">
<defs>
 <clipPath id="${clipId}"><path d="${archPath()}"/><rect x="${lx}" y="${apex - 2}" width="0" height="0"/></clipPath>
 <linearGradient id="sm-wood-${side}" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" style="stop-color:${V(side === "left" ? "wood-dark" : "wood")}"/><stop offset=".5" style="stop-color:${V("wood")}"/><stop offset="1" style="stop-color:${V(side === "left" ? "wood" : "wood-dark")}"/>
 </linearGradient>
 <radialGradient id="sm-brass-${side}" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#FFF1C2"/><stop offset=".5" style="stop-color:${V("brass")}"/><stop offset="1" stop-color="#5A3A10"/></radialGradient>
</defs>
<g clip-path="url(#${clipId})">
 <rect x="${lx}" y="${apex - 4}" width="${w}" height="${bottom - apex + 4}" fill="url(#sm-wood-${side})"/>
 <g stroke="${V("wood-dark")}" stroke-width="1.4" opacity=".7">${rays}</g>
 ${panel(386, 146)}${panel(552, 132)}
 <circle cx="${lx + w / 2}" cy="459" r="22" fill="none" stroke="${V("brass")}" stroke-width="1.6" opacity=".75"/>
 <path d="M${lx + w / 2},440 c6,8 6,14 0,19 c-6,-5 -6,-11 0,-19 Z M${lx + w / 2 - 15},455 c8,0 13,3 15,8 c-6,2 -11,0 -15,-8 Z M${lx + w / 2 + 15},455 c-8,0 -13,3 -15,8 c6,2 11,0 15,-8 Z" fill="${V("brass")}" opacity=".8"/>
 <rect x="${lx}" y="372" width="${w}" height="8" fill="${V("brass")}" opacity=".8"/>
 <rect x="${lx}" y="536" width="${w}" height="8" fill="${V("brass")}" opacity=".8"/>
 <rect x="${lx}" y="688" width="${w}" height="8" fill="${V("brass")}" opacity=".8"/>
 <g fill="url(#sm-brass-${side})">${studs.join("")}</g>
 <circle cx="${knockX}" cy="470" r="7.5" fill="none" stroke="url(#sm-brass-${side})" stroke-width="2.6"/>
 <circle cx="${knockX}" cy="462" r="2.6" fill="url(#sm-brass-${side})"/>
 <line x1="${meetX}" y1="${apex}" x2="${meetX}" y2="${bottom}" stroke="#000" stroke-opacity=".45" stroke-width="1.4"/>
 <rect class="sm-door-shade" x="${lx}" y="${apex - 4}" width="${w}" height="${bottom - apex + 4}" fill="#000" opacity="0"/>
</g>
</svg>`;
}

const marigold = (x: number, y: number, r: number, i: number) =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#sm-mg-${i % 2})"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.55).toFixed(2)}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width=".8"/>`;

/** Marigold toran with mango leaves across the arch, plus two hanging ladis. */
export function toranSvg(): string {
  const swags = 4, x0 = 62, x1 = 298, y = 246;
  const seg = (x1 - x0) / swags;
  const flowers: string[] = [];
  const leaves: string[] = [];
  let k = 0;
  for (let s = 0; s < swags; s++) {
    const sx = x0 + s * seg;
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const fx = sx + u * seg;
      const fy = y + Math.sin(u * Math.PI) * 22;
      flowers.push(marigold(fx, fy, 5.2, k++));
    }
    const lx = sx + seg / 2;
    leaves.push(`<path d="M${lx},${y + 26} q-5,10 0,26 q5,-16 0,-26 Z" fill="${V("leaf")}"/>`);
    leaves.push(`<path d="M${lx - 10},${y + 22} q-6,8 -3,22 q6,-12 3,-22 Z" fill="${V("leaf")}" opacity=".85"/>`);
    leaves.push(`<path d="M${lx + 10},${y + 22} q6,8 3,22 q-6,-12 -3,-22 Z" fill="${V("leaf")}" opacity=".85"/>`);
  }
  const ladi = (cx: number) => Array.from({ length: 34 }, (_, i) => marigold(cx, 252 + i * 9.6, i % 7 === 6 ? 4 : 4.8, i + 1)).join("") +
    `<path d="M${cx},${252 + 34 * 9.6} l-4,14 h8 Z" fill="${V("accent")}"/>`;
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true">
<defs>
 <radialGradient id="sm-mg-0" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE08A"/><stop offset=".6" style="stop-color:${V("marigold")}"/><stop offset="1" style="stop-color:${V("marigold-deep")}"/></radialGradient>
 <radialGradient id="sm-mg-1" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFD25A"/><stop offset=".6" stop-color="#F7B500"/><stop offset="1" stop-color="#C98200"/></radialGradient>
</defs>
<g class="sm-ladi sm-ladi-l">${ladi(72)}</g>
<g class="sm-ladi sm-ladi-r">${ladi(288)}</g>
<g class="sm-toran"><path d="M${x0},${y} H${x1}" stroke="${V("wood-dark")}" stroke-width="1.5"/>${leaves.join("")}${flowers.join("")}</g>
</svg>`;
}

/** A brass diya with a flame; the flame element is animated by the clock. */
export function diyaSvg(id: string): string {
  return `<svg viewBox="0 0 60 70" aria-hidden="true" style="overflow:visible">
<defs>
 <radialGradient id="sm-dg-${id}"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".9"/><stop offset=".45" style="stop-color:${V("glow")}" stop-opacity=".35"/><stop offset="1" style="stop-color:${V("glow")}" stop-opacity="0"/></radialGradient>
 <linearGradient id="sm-fl-${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF7A00"/><stop offset=".45" stop-color="#FFC33D"/><stop offset="1" stop-color="#FFF6D0"/></linearGradient>
 <linearGradient id="sm-db-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7D58A"/><stop offset=".5" style="stop-color:${V("brass")}"/><stop offset="1" stop-color="#6A4512"/></linearGradient>
</defs>
<circle class="sm-glow" cx="30" cy="30" r="34" fill="url(#sm-dg-${id})"/>
<g class="sm-flame" style="transform-origin:30px 46px"><path d="M30,18 C36,30 37,38 30,46 C23,38 24,30 30,18 Z" fill="url(#sm-fl-${id})"/><path d="M30,32 C32,37 32,41 30,45 C28,41 28,37 30,32 Z" fill="#fff" opacity=".75"/></g>
<path d="M8,47 Q30,66 52,47 Q54,46 58,42 Q50,47 46,46 Q30,52 14,46 Q10,46 8,47 Z" fill="url(#sm-db-${id})"/>
<path d="M18,60 h24 l-4,6 h-16 Z" fill="url(#sm-db-${id})"/>
</svg>`;
}

/** Ground rangoli (decorative, non-religious), seen at the threshold. */
export function rangoliSvg(): string {
  const petals = (r: number, n: number, col: string, size: number) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<ellipse cx="${(180 + Math.cos(a) * r).toFixed(1)}" cy="${(726 + Math.sin(a) * r * 0.32).toFixed(1)}" rx="${size}" ry="${(size * 0.45).toFixed(1)}" fill="${col}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(180 + Math.cos(a) * r).toFixed(1)} ${(726 + Math.sin(a) * r * 0.32).toFixed(1)})"/>`;
  }).join("");
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true"><g opacity=".9">
${petals(70, 28, "var(--accent)", 7)}${petals(52, 20, "var(--marigold)", 6)}${petals(34, 14, "#FFF6E0", 5)}
<ellipse cx="180" cy="726" rx="18" ry="6" fill="var(--leaf)"/></g></svg>`;
}
