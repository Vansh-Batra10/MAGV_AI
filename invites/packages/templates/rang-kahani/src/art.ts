/** Rang Kahani art: cloth table, book cover, skylines, props. Flat paper colours from pack tokens. */
const V = (n: string) => `var(--${n})`;
const EDGE = `stroke="#FFFDF6" stroke-width="1.6" stroke-linejoin="round"`;

export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="rk-paper-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="1.5" dy="3" stdDeviation="1.6" flood-color="#231942" flood-opacity=".32"/></filter>
<filter id="rk-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .14  0 0 0 0 .1  0 0 0 0 .26  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs></svg>`;

/** Block-print cloth for the table (pattern tile). */
export function clothSvg(): string {
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<pattern id="rk-block" width="40" height="40" patternUnits="userSpaceOnUse">
<rect width="40" height="40" fill="${V("cloth")}"/>
<path d="M20,6 c5,6 5,10 0,14 c-5,-4 -5,-8 0,-14 Z M20,34 c5,-6 5,-10 0,-14 c-5,4 -5,8 0,14 Z M6,20 c6,-5 10,-5 14,0 c-4,5 -8,5 -14,0 Z M34,20 c-6,-5 -10,-5 -14,0 c4,5 8,5 14,0 Z" fill="${V("cloth-print")}" opacity=".55"/>
<circle cx="0" cy="0" r="3" fill="${V("cloth-print")}" opacity=".5"/><circle cx="40" cy="40" r="3" fill="${V("cloth-print")}" opacity=".5"/><circle cx="40" cy="0" r="3" fill="${V("cloth-print")}" opacity=".5"/><circle cx="0" cy="40" r="3" fill="${V("cloth-print")}" opacity=".5"/>
</pattern>
<radialGradient id="rk-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
</defs><rect width="360" height="740" fill="url(#rk-block)"/><rect width="360" height="740" fill="url(#rk-vig)"/></svg>`;
}

/** Hand-painted truck-art border (scallops, dots, stripes) for the book cover. */
export function coverBorderSvg(): string {
  const scallops = (y: number, flip: boolean) => Array.from({ length: 14 }, (_, i) => `<path d="M${12 + i * 21},${y} q10.5,${flip ? -12 : 12} 21,0" fill="${V("turmeric")}" ${EDGE}/>`).join("");
  const dots = (x0: number, y0: number, x1: number, y1: number, n: number) => Array.from({ length: n }, (_, i) => `<circle cx="${(x0 + ((x1 - x0) * i) / (n - 1)).toFixed(1)}" cy="${(y0 + ((y1 - y0) * i) / (n - 1)).toFixed(1)}" r="2.2" fill="${i % 2 ? V("paper") : V("bottle")}"/>`).join("");
  return `<svg viewBox="0 0 320 440" preserveAspectRatio="none" aria-hidden="true">
<rect x="6" y="6" width="308" height="428" rx="8" fill="none" stroke="${V("turmeric")}" stroke-width="5"/>
<rect x="14" y="14" width="292" height="412" rx="5" fill="none" stroke="${V("paper")}" stroke-width="2" stroke-dasharray="6 5"/>
${scallops(20, false)}${scallops(420, true)}
${dots(24, 48, 24, 392, 16)}${dots(296, 48, 296, 392, 16)}
${[[30, 40], [290, 40], [30, 400], [290, 400]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="9" fill="${V("bottle")}" ${EDGE}/><path d="M0,-6 l2,4 l4,2 l-4,2 l-2,4 l-2,-4 l-4,-2 l4,-2 z" fill="${V("turmeric")}"/></g>`).join("")}
</svg>`;
}

export function skylineSvg(pack: string): string {
  if (pack === "dilli-sardi") {
    return `<g fill="${V("sky-ink")}" opacity=".9">
<path d="M20,300 V250 h10 v-20 q10,-18 20,0 v20 h10 V300 Z"/>
<path d="M90,300 V200 q0,-6 5,-6 h4 v-30 h6 v-14 h4 v14 h6 v30 h4 q5,0 5,6 V300 Z"/>
<path d="M150,300 V240 q30,-50 60,0 V300 Z M160,240 h40"/><path d="M175,196 h10 v-10 h-10 z"/>
<path d="M240,300 V230 h70 V300 Z M250,230 v-14 h50 v14 Z M262,216 q13,-26 26,0 Z"/>
</g><g class="rk-fog" opacity=".55"><rect x="-20" y="262" width="400" height="44" fill="#FFF8EE"/><rect x="-40" y="240" width="300" height="26" rx="13" fill="#FFF8EE" opacity=".6"/></g>`;
  }
  if (pack === "goa-sunset") {
    return `<circle cx="250" cy="222" r="38" fill="${V("turmeric")}" opacity=".9"/>
<g fill="${V("sky-ink")}"><path d="M0,300 V270 h360 V300 Z"/><path d="M40,270 q-6,-40 -2,-80 M38,190 q-22,-8 -34,4 M38,190 q20,-12 34,0 M38,190 q-10,-18 -26,-20 M38,190 q12,-20 28,-18" stroke="${V("sky-ink")}" stroke-width="4" fill="none"/>
<path d="M300,270 q8,-44 0,-90 M300,180 q-22,-6 -32,8 M300,180 q22,-10 34,4 M300,180 q-8,-18 -24,-22 M300,180 q10,-20 26,-16" stroke="${V("sky-ink")}" stroke-width="4" fill="none"/>
<path d="M110,270 v-24 l26,-16 l26,16 v24 Z M180,270 v-20 l20,-12 l20,12 v20 Z"/></g>
<path d="M0,282 q30,-6 60,0 t60,0 t60,0 t60,0 t60,0 t60,0" stroke="${V("paper")}" stroke-width="2" fill="none" opacity=".6"/>`;
  }
  // Bombay Monsoon: Gateway-like arch, chawls, sea-link cables, a kaali-peeli taxi silhouette (no branding).
  return `<g fill="${V("sky-ink")}" opacity=".92">
<path d="M10,300 V214 h56 V300 Z M18,224 h12 v12 h-12 Z M40,224 h12 v12 h-12 Z M18,248 h12 v12 h-12 Z M40,248 h12 v12 h-12 Z" fill-rule="evenodd"/>
<path d="M80,300 V200 h18 v-16 h44 v16 h18 V300 h-26 V250 q-14,-24 -28,0 V300 Z"/>
<circle cx="99" cy="188" r="5"/><circle cx="141" cy="188" r="5"/>
<path d="M180,300 V180 h8 V300 Z M260,300 V180 h8 V300 Z"/>
<path d="M184,184 L230,262 M184,184 L210,262 M264,184 L224,262 M264,184 L244,262" stroke="${V("sky-ink")}" stroke-width="1.4"/>
<path d="M170,262 H360 v8 H170 Z"/>
<path d="M290,300 V230 h60 V300 Z"/>
</g>
<g class="rk-taxi" transform="translate(206 280)"><rect x="0" y="0" width="54" height="14" rx="4" fill="#1B1B1B"/><rect x="10" y="-9" width="32" height="11" rx="3" fill="#F4C430"/><rect x="0" y="5" width="54" height="5" fill="#F4C430"/><circle cx="12" cy="15" r="5" fill="#231942"/><circle cx="42" cy="15" r="5" fill="#231942"/></g>`;
}

export function rainSvg(n: number): string {
  return `<g class="rk-rain" stroke="${V("paper")}" stroke-width="1.2" opacity=".55">${Array.from({ length: n }, (_, i) => `<path class="rk-drop" data-i="${i}" d="M0,0 l-4,12"/>`).join("")}</g>`;
}

/** A scooter (generic, no brand), rider puppets are placed on top by the template. */
export function scooterSvg(): string {
  return `<g class="rk-scooter" filter="url(#rk-paper-shadow)">
<g class="rk-wheel rk-wheel-b" transform="translate(-34 -12)"><circle r="12" fill="#231942" ${EDGE}/><circle r="5" fill="${V("paper")}"/><path d="M-12,0 H12 M0,-12 V12" stroke="${V("paper")}" stroke-width="1.4"/></g>
<g class="rk-wheel rk-wheel-f" transform="translate(40 -12)"><circle r="12" fill="#231942" ${EDGE}/><circle r="5" fill="${V("paper")}"/><path d="M-12,0 H12 M0,-12 V12" stroke="${V("paper")}" stroke-width="1.4"/></g>
<path d="M-50,-20 Q-50,-44 -24,-44 H10 L22,-30 L40,-30 L46,-14 L-46,-14 Z" fill="${V("rani")}" ${EDGE}/>
<path d="M-40,-46 h36 q4,0 4,4 v3 h-44 v-3 q0,-4 4,-4 Z" fill="#231942"/>
<path d="M34,-30 L44,-66 M38,-66 h16" stroke="#231942" stroke-width="4" stroke-linecap="round"/>
<circle cx="46" cy="-56" r="5" fill="${V("turmeric")}" ${EDGE}/>
<path d="M50,-62 h18 v14 q-9,6 -18,0 Z" fill="${V("bottle")}" ${EDGE}/>
</g>`;
}

export function speechBubble(text: string): string {
  return `<div class="rk-bubble" role="note">${text}</div>`;
}

/** Function props (sticker style). */
export const PROPS = {
  dhol: `<g filter="url(#rk-paper-shadow)"><rect x="-22" y="-16" width="44" height="32" rx="14" fill="${V("rani")}" ${EDGE}/><path d="M-14,-16 l8,32 M-2,-16 l8,32 M10,-16 l8,32" stroke="${V("turmeric")}" stroke-width="2"/><ellipse cx="-22" cy="0" rx="5" ry="16" fill="${V("paper")}" ${EDGE}/><ellipse cx="22" cy="0" rx="5" ry="16" fill="${V("paper")}" ${EDGE}/></g>`,
  chai: `<g filter="url(#rk-paper-shadow)"><path d="M-9,-12 h18 l-3,20 h-12 Z" fill="${V("paper")}" opacity=".9" ${EDGE}/><path d="M-8,-6 h16 l-2,13 h-12 Z" fill="#B5651D"/><path class="rk-steam" d="M-3,-16 q-4,-6 0,-12 q4,-6 0,-12 M4,-16 q-4,-6 0,-12" stroke="${V("paper")}" stroke-width="1.6" fill="none" opacity=".8"/></g>`,
  marigold: (r = 5) => `<circle r="${r}" fill="${V("turmeric")}"/><circle r="${(r * 0.5).toFixed(1)}" fill="#E07A12"/>`,
  rangoli: `<g>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<ellipse cx="${(Math.cos(a) * 22).toFixed(1)}" cy="${(Math.sin(a) * 8).toFixed(1)}" rx="9" ry="4" fill="${i % 2 ? V("rani") : V("turmeric")}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 8).toFixed(1)})"/>`; }).join("")}<ellipse rx="10" ry="4" fill="${V("bottle")}"/></g>`,
  umbrella: `<g filter="url(#rk-paper-shadow)"><path d="M-30,0 Q0,-34 30,0 Q20,-6 10,0 Q0,-6 -10,0 Q-20,-6 -30,0 Z" fill="${V("indigo")}" ${EDGE}/><path d="M0,-16 V28 q0,6 -6,6" stroke="#231942" stroke-width="2.4" fill="none"/></g>`,
  cake: `<g filter="url(#rk-paper-shadow)"><rect x="-26" y="-14" width="52" height="22" rx="3" fill="${V("paper")}" ${EDGE}/><rect x="-18" y="-32" width="36" height="18" rx="3" fill="${V("rani")}" opacity=".85" ${EDGE}/><rect x="-10" y="-46" width="20" height="14" rx="3" fill="${V("paper")}" ${EDGE}/><path d="M0,-46 v-8" stroke="#231942" stroke-width="2"/><path d="M0,-58 q3,4 0,6 q-3,-2 0,-6 Z" fill="${V("turmeric")}"/></g>`,
  mandap: `<g><path d="M-80,0 V-110 M80,0 V-110 M-60,0 V-98 M60,0 V-98" stroke="${V("turmeric")}" stroke-width="6"/><path d="M-92,-108 Q0,-160 92,-108 Z" fill="${V("rani")}" ${EDGE}/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${-80 + i * 20}" cy="${-106 + Math.abs(4 - i) * 2}" r="5" fill="${V("turmeric")}"/>`).join("")}</g>`,
};

/** Clay gullak (piggy bank) for shagun. */
export function gullakSvg(): string {
  return `<svg viewBox="0 0 140 120" role="img" aria-label="Gullak"><g filter="url(#rk-paper-shadow)">
<ellipse cx="70" cy="70" rx="48" ry="38" fill="#C8693C" stroke="#FFFDF6" stroke-width="2"/>
<path d="M58,36 q12,-14 24,0" fill="#C8693C" stroke="#FFFDF6" stroke-width="2"/>
<rect class="rk-slot" x="58" y="38" width="24" height="5" rx="2.5" fill="#3B1A0C"/>
<path d="M30,96 q40,22 80,0" stroke="#8F4422" stroke-width="3" fill="none"/>
${[0, 1, 2, 3, 4].map((i) => `<circle cx="${42 + i * 14}" cy="74" r="4" fill="${i % 2 ? "#F4B400" : "#FFF1D6"}"/>`).join("")}
<path d="M40,60 q30,-10 60,0" stroke="#F4B400" stroke-width="2.5" fill="none" stroke-dasharray="4 4"/>
</g><g class="rk-coin" opacity="0"><circle cx="70" cy="10" r="9" fill="#F4C430" stroke="#B8860B" stroke-width="2"/><text x="70" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="#8A5A00">₹</text></g></svg>`;
}
