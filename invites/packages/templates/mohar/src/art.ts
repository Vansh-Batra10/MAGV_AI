import type { PRNG } from "@invites/renderer";

/** Mohar art. One light source, top-left, everywhere: highlights on top-left edges, shadows fall bottom-right. */
const V = (n: string) => `var(--${n})`;

export function velvetSvg(): string {
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<radialGradient id="mh-vel" cx=".28" cy=".2" r="1"><stop offset="0" style="stop-color:${V("velvet-hi")}"/><stop offset=".55" style="stop-color:${V("velvet")}"/><stop offset="1" style="stop-color:${V("velvet-lo")}"/></radialGradient>
<filter id="mh-nap" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
</defs><rect width="360" height="740" fill="url(#mh-vel)"/><rect width="360" height="740" filter="url(#mh-nap)"/></svg>`;
}

/** Top-down ivory box with lid. Sizes in a 300×380 box. */
export const BOX = { w: 300, h: 380 } as const;

export function boxBaseSvg(): string {
  return `<svg viewBox="0 0 300 380" aria-hidden="true"><defs><linearGradient id="mh-base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${V("ivory-lo")}"/><stop offset="1" stop-color="#C9BEA9"/></linearGradient></defs>
<rect x="4" y="4" width="292" height="372" rx="6" fill="url(#mh-base)"/><rect x="16" y="16" width="268" height="348" rx="3" fill="#D9CFBD"/>
<rect x="16" y="16" width="268" height="348" rx="3" fill="none" stroke="#B8AC96" stroke-width="1"/></svg>`;
}

export function lidSvg(): string {
  return `<svg viewBox="0 0 300 380" aria-hidden="true"><defs>
<linearGradient id="mh-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDF8"/><stop offset=".55" style="stop-color:${V("ivory")}"/><stop offset="1" style="stop-color:${V("ivory-lo")}"/></linearGradient>
<filter id="mh-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .08 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<rect x="0" y="0" width="300" height="380" rx="8" fill="url(#mh-lid)"/>
<rect x="0" y="0" width="300" height="380" rx="8" fill="#fff" filter="url(#mh-paper)"/>
<rect x="12" y="12" width="276" height="356" rx="4" fill="none" stroke="${V("gold")}" stroke-width="1"/>
<rect x="18" y="18" width="264" height="344" rx="3" fill="none" stroke="${V("gold")}" stroke-width=".5"/>
${[[18, 18, 1, 1], [282, 18, -1, 1], [18, 362, 1, -1], [282, 362, -1, -1]].map(([x, y, sx, sy]) => `<path d="M${x},${y! + sy! * 26} q0,${-sy! * 20} ${sx! * 20},${-sy! * 22} q${sx! * 4},0 ${sx! * 6},${sy! * 0} M${x! + sx! * 26},${y} q${-sx! * 20},0 ${-sx! * 22},${sy! * 20}" fill="none" stroke="${V("gold")}" stroke-width="1"/>`).join("")}
<path d="M1.5,1.5 H298.5" stroke="#fff" stroke-width="2" opacity=".9"/><path d="M1.5,1.5 V378" stroke="#fff" stroke-width="2" opacity=".7"/>
</svg>`;
}

/** Olive silk ribbon (vertical + horizontal band) with a sheen. */
export function ribbonSvg(): string {
  return `<svg viewBox="0 0 300 380" aria-hidden="true"><defs>
<linearGradient id="mh-silk-v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${V("silk")}"/><stop offset=".3" style="stop-color:${V("silk-hi")}"/><stop offset=".55" style="stop-color:${V("silk")}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
<linearGradient id="mh-silk-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${V("silk-hi")}"/><stop offset=".45" style="stop-color:${V("silk")}"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
</defs>
<g class="mh-ribbon-v"><rect x="134" y="-4" width="32" height="388" fill="url(#mh-silk-v)"/><rect x="134" y="-4" width="32" height="388" fill="${V("silk")}" opacity=".35"/></g>
<g class="mh-ribbon-h"><rect x="-4" y="214" width="308" height="28" fill="url(#mh-silk-h)"/></g>
</svg>`;
}

/** Wax seal: irregular blob with an embossed monogram; five pre-cut shards for the crack. */
export function sealShards(rng: PRNG): { svg: string; count: number } {
  const R = 38;
  const pts: [number, number][] = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const r = R + rng.range(-2.6, 2.2) + (i % 3 === 0 ? 2.2 : 0); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const blob = `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
  const cuts = [0, 1.3, 2.4, 3.7, 5.0].map((a) => a + rng.range(-0.2, 0.2));
  const shards: string[] = [];
  for (let k = 0; k < 5; k++) {
    const a0 = cuts[k]!, a1 = cuts[(k + 1) % 5]! + (k === 4 ? Math.PI * 2 : 0);
    const jag = (a: number) => [0.3, 0.55, 0.8].map((f, j) => `${(Math.cos(a + (j % 2 ? 0.08 : -0.06)) * R * f).toFixed(1)},${(Math.sin(a + (j % 2 ? 0.08 : -0.06)) * R * f).toFixed(1)}`);
    const arc: string[] = [];
    for (let i = 0; i <= 8; i++) { const a = a0 + ((a1 - a0) * i) / 8; arc.push(`${(Math.cos(a) * (R + 6)).toFixed(1)},${(Math.sin(a) * (R + 6)).toFixed(1)}`); }
    const d = `M${rng.range(-2, 2).toFixed(1)},${rng.range(-2, 2).toFixed(1)} L${jag(a0).join(" L")} L${arc.join(" L")} L${jag(a1).reverse().join(" L")} Z`;
    shards.push(`<g class="mh-shard" data-k="${k}" clip-path="url(#mh-shard-${k})"><use href="#mh-seal-face"/></g><clipPath id="mh-shard-${k}"><path d="${d}"/></clipPath>`);
  }
  const svg = `<svg viewBox="-60 -60 120 120" aria-hidden="true" style="overflow:visible"><defs>
<radialGradient id="mh-wax" cx=".32" cy=".28" r=".85"><stop offset="0" style="stop-color:${V("seal-hi")}"/><stop offset=".6" style="stop-color:${V("seal")}"/><stop offset="1" stop-color="#1A0612"/></radialGradient>
<g id="mh-seal-face"><path d="${blob}" fill="url(#mh-wax)"/><circle r="27" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2.4"/><circle r="27" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1" transform="translate(-.8 -.8)"/>
<g class="mh-seal-mono" font-family="Bodoni Moda, serif" font-style="italic" font-size="30" text-anchor="middle"><text y="10" fill="#000" fill-opacity=".35" transform="translate(1 1)">§</text><text y="10" fill="#fff" fill-opacity=".22">§</text></g></g>
</defs>
<ellipse cx="4" cy="6" rx="40" ry="38" fill="#000" opacity=".28" class="mh-seal-shadow"/>
<g class="mh-seal-whole"><use href="#mh-seal-face"/></g>
<g class="mh-shards" style="display:none">${shards.join("")}</g>
</svg>`;
  return { svg, count: 5 };
}

export function tissueSvg(side: "l" | "r"): string {
  return `<svg viewBox="0 0 134 348" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mh-tis-${side}" x1="${side === "l" ? 0 : 1}" y1="0" x2="${side === "l" ? 1 : 0}" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".92"/><stop offset="1" stop-color="#EDE6F2" stop-opacity=".85"/></linearGradient></defs>
<path d="M0,0 H134 V348 H0 Z" fill="url(#mh-tis-${side})"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${10 + i * 22},0 q${(i % 2 ? 6 : -6)},170 0,348" stroke="#fff" stroke-width="3" opacity=".5" fill="none"/>`).join("")}</svg>`;
}

/** Procedural watercolour of a haveli venue: pencil line layer + paint layer revealed by a displaced mask. */
export function venuePainting(rng: PRNG, id: string): string {
  const wash = (cx: number, cy: number, rx: number, ry: number, c: string, o: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${o}"/>`;
  const seeds = [rng.range(80, 140), rng.range(60, 100), rng.range(160, 220), rng.range(80, 120), rng.range(120, 180), rng.range(130, 160)];
  const arches = [60, 100, 140, 180, 220].map((x) => `M${x},150 v-26 q14,-18 28,0 v26`).join(" ");
  const line = `<g fill="none" stroke="#4A3B3F" stroke-width=".9" stroke-linecap="round" opacity=".85">
<path d="M30,160 H270 M40,160 V96 H260 V160 M40,96 L60,80 H240 L260,96"/><path d="${arches}"/>
<path d="M120,80 V60 q30,-34 60,0 V80 M150,26 v-8"/><path d="M60,80 V66 q10,-14 20,0 V80 M220,80 V66 q10,-14 20,0 V80"/>
<path d="M14,168 q40,-8 80,0 t80,0 t80,0 t60,0"/><path d="M20,140 q-6,-20 6,-34 q10,14 4,34 M280,140 q-6,-22 6,-36 q10,16 4,36"/>
${Array.from({ length: 8 }, (_, i) => `<path d="M${52 + i * 26},112 v10"/>`).join("")}</g>`;
  const paint = `<g filter="url(#${id}-bleed)">
${wash(150, 50, 170, 60, "#F3C9B8", 0.55)}${wash(70, 40, 90, 40, "#C9D8EE", 0.6)}${wash(240, 30, 80, 30, "#E9D7F0", 0.55)}
<path d="M40,160 V96 H260 V160 Z" fill="#F2E3C8"/><path d="M40,96 L60,80 H240 L260,96 Z" fill="#E7C99E"/>
<path d="M120,80 V60 q30,-34 60,0 V80 Z" fill="#EFD5AE"/><path d="M60,80 V66 q10,-14 20,0 V80 Z M220,80 V66 q10,-14 20,0 V80 Z" fill="#E7C99E"/>
<path d="${arches}" fill="#9B7A8C" opacity=".55"/>
${wash(150, 175, 160, 18, "#9DB89A", 0.6)}${wash(seeds[0]!, 168, 50, 10, "#7F9F7E", 0.5)}${wash(seeds[2]!, 170, 60, 9, "#B7CFA8", 0.5)}
<path d="M20,140 q-6,-20 6,-34 q10,14 4,34 Z M280,140 q-6,-22 6,-36 q10,16 4,36 Z" fill="#6E8A5E" opacity=".8"/>
${wash(150, 120, 120, 50, "#F7D9A8", 0.25)}
</g>`;
  const blooms = [[seeds[0], seeds[1]], [seeds[2], seeds[3]], [seeds[4], seeds[5]]];
  return `<svg viewBox="0 0 300 190" class="mh-venue" aria-hidden="true"><defs>
<filter id="${id}-bleed" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/><feGaussianBlur stdDeviation=".6"/></filter>
<filter id="${id}-edge" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence class="mh-turb" type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="28"/></filter>
<mask id="${id}-mask"><g filter="url(#${id}-edge)">${blooms.map(([x, y], i) => `<circle class="mh-bloom" data-i="${i}" cx="${x!.toFixed(0)}" cy="${y!.toFixed(0)}" r="0" fill="#fff"/>`).join("")}</g></mask>
</defs>
<g class="mh-venue-line">${line}</g>
<g class="mh-venue-paint" mask="url(#${id}-mask)">${paint}${line}</g>
</svg>`;
}

/** Haveli stained-glass arch window framing the function list. */
export function stainedGlassSvg(colors: string[]): string {
  const panes = colors.map((c, i) => {
    const n = colors.length;
    const x0 = 40 + (i * 220) / n, x1 = 40 + ((i + 1) * 220) / n;
    return `<path d="M${x0.toFixed(1)},300 V120 L${((x0 + x1) / 2).toFixed(1)},${(70 + Math.abs(i - (n - 1) / 2) * 12).toFixed(1)} L${x1.toFixed(1)},120 V300 Z" fill="${c}" opacity=".78"/>`;
  }).join("");
  return `<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><clipPath id="mh-sg-clip"><path d="M40,300 V130 Q40,60 150,24 Q260,60 260,130 V300 Z"/></clipPath></defs>
<g clip-path="url(#mh-sg-clip)"><rect width="300" height="300" fill="#2B1B26"/>${panes}
${Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => `<circle cx="${52 + c * 28}" cy="${136 + r * 28}" r="9" fill="none" stroke="#2B1B26" stroke-width="3"/>`).join("")).join("")}
<path d="M150,24 V300 M40,160 H260" stroke="#2B1B26" stroke-width="4"/></g>
<path d="M40,300 V130 Q40,60 150,24 Q260,60 260,130 V300" fill="none" stroke="${V("gold")}" stroke-width="3"/>
<path d="M30,300 V128 Q30,52 150,12 Q270,52 270,128 V300" fill="none" stroke="${V("gold")}" stroke-width="1.2"/></svg>`;
}
