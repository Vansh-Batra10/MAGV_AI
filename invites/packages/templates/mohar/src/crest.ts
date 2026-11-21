/**
 * Procedural monogram crest (§8.2): one partner's initial in Devanagari interlaced with the other's in Latin
 * (or both in one script) inside one of six vector frames. Pure SVG; the couple can export SVG/PNG.
 */
export type CrestFrame = "oval" | "arch" | "lotus" | "laurel" | "peacock" | "elephant";
export const CREST_FRAMES: CrestFrame[] = ["oval", "arch", "lotus", "laurel", "peacock", "elephant"];

const G = "var(--gold)";

function frame(kind: CrestFrame): string {
  const s = `fill="none" stroke="${G}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case "arch":
      return `<path ${s} d="M44,176 V88 Q44,52 70,40 Q88,32 100,14 Q112,32 130,40 Q156,52 156,88 V176 Z"/><path ${s} d="M52,170 V90 Q52,60 74,49 Q90,42 100,26 Q110,42 126,49 Q148,60 148,90 V170 Z" stroke-width="1"/><path ${s} d="M100,14 v-8 M96,6 h8"/><path ${s} d="M36,176 H164"/>`;
    case "lotus":
      return `<circle cx="100" cy="100" r="62" ${s}/>${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; const x = 100 + Math.cos(a) * 72, y = 100 + Math.sin(a) * 72; return `<path ${s} stroke-width="1.2" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" d="M${x.toFixed(1)},${(y + 8).toFixed(1)} q-6,-8 0,-16 q6,8 0,16 z"/>`; }).join("")}<circle cx="100" cy="100" r="80" ${s} stroke-width=".8" stroke-dasharray="1 4"/>`;
    case "laurel": {
      const leaves = (side: 1 | -1) => Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.62 + i * 0.075); const x = 100 + side * Math.cos(a) * -64, y = 100 + Math.sin(a) * 64; return `<path ${s} stroke-width="1.1" d="M${x.toFixed(1)},${y.toFixed(1)} q${side * 9},-4 ${side * 12},-12 q${side * -9},2 ${side * -12},12 z"/>`; }).join("");
      return `<path ${s} d="M60,156 Q36,110 56,60"/><path ${s} d="M140,156 Q164,110 144,60"/>${leaves(1)}${leaves(-1)}<path ${s} d="M86,160 q-10,10 0,18 q10,-4 6,-12 q-4,-6 -6,-6 z M114,160 q10,10 0,18 q-10,-4 -6,-12 q4,-6 6,-6 z"/>`;
    }
    case "peacock": {
      const bird = (side: 1 | -1) => `<g transform="translate(${side === 1 ? 0 : 200} 0) scale(${side} 1)"><path ${s} d="M28,170 q-6,-40 14,-62 q10,-12 8,-28 q-1,-10 8,-12 q8,0 6,10 q-4,16 4,30 q12,22 4,62"/><path ${s} d="M58,66 l-4,-10 M62,66 l2,-11 M60,66 l-1,-12"/><circle cx="54" cy="55" r="1.6" fill="${G}"/><circle cx="64" cy="55" r="1.6" fill="${G}"/><circle cx="59" cy="54" r="1.6" fill="${G}"/>${Array.from({ length: 5 }, (_, i) => `<path ${s} stroke-width="1" d="M36,170 q${-14 - i * 2},${-10 - i * 10} ${-6 - i * 3},${-30 - i * 10}"/><circle cx="${30 - i * 3}" cy="${140 - i * 10}" r="2.2" ${s} stroke-width=".9"/>`).join("")}</g>`;
      return `${bird(1)}${bird(-1)}<path ${s} d="M70,172 H130"/>`;
    }
    case "elephant": {
      const el = (side: 1 | -1) => `<g transform="translate(${side === 1 ? 0 : 200} 0) scale(${side} 1)"><path ${s} d="M18,172 v-26 q0,-24 22,-30 q18,-4 26,8 q6,8 4,20 q-2,8 4,10 q6,0 8,-10 l4,0 q0,18 -14,20 q-8,0 -10,-8 v38 h-10 v-20 h-14 v20 Z"/><circle cx="54" cy="128" r="1.8" fill="${G}"/><path ${s} d="M40,118 q-10,6 -8,22"/><path ${s} d="M30,112 h26 v-6 h-26 z" stroke-width="1"/></g>`;
      return `${el(1)}${el(-1)}<path ${s} d="M66,172 H134"/>`;
    }
    default:
      return `<ellipse cx="100" cy="100" rx="62" ry="78" ${s}/><ellipse cx="100" cy="100" rx="56" ry="72" ${s} stroke-width=".9"/><path ${s} d="M80,22 q20,-14 40,0 M80,178 q20,14 40,0"/><circle cx="100" cy="14" r="3" ${s}/><circle cx="100" cy="186" r="3" ${s}/>`;
  }
}

export function firstGrapheme(s: string): string {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (!Seg) return s.slice(0, 1);
  return Array.from(new Seg("hi", { granularity: "grapheme" }).segment(s.trim()))[0]?.segment ?? "";
}

/**
 * @param a first initial (rendered in Devanagari font when `aDeva`), @param b second initial (Latin, italic Bodoni)
 */
export function crestSvg(opts: { a: string; b: string; aDeva: boolean; bDeva?: boolean; frame: CrestFrame; id?: string; draw?: boolean; label?: string }): string {
  const id = opts.id ?? "mh-crest";
  const fA = opts.aDeva ? `font-family="Tiro Devanagari Hindi, serif" font-size="78"` : `font-family="Bodoni Moda, serif" font-style="italic" font-size="84"`;
  const fB = opts.bDeva ? `font-family="Tiro Devanagari Hindi, serif" font-size="78"` : `font-family="Bodoni Moda, serif" font-style="italic" font-size="84"`;
  const letterA = (extra = "") => `<text x="86" y="${opts.aDeva ? 122 : 128}" text-anchor="middle" ${fA} ${extra}>${opts.a}</text>`;
  const letterB = (extra = "") => `<text x="116" y="${opts.bDeva ? 126 : 132}" text-anchor="middle" ${fB} ${extra}>${opts.b}</text>`;
  const draw = opts.draw ? `class="mh-draw"` : "";
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${opts.label ?? "Monogram"}" class="mh-crest">
<defs><clipPath id="${id}-weave"><rect x="0" y="0" width="200" height="100"/></clipPath>
<linearGradient id="${id}-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--gold-hi)"/><stop offset=".5" style="stop-color:var(--gold)"/><stop offset="1" style="stop-color:var(--gold-hi)"/></linearGradient></defs>
<g ${draw}>${frame(opts.frame)}</g>
<g fill="url(#${id}-foil)" stroke="var(--ink)" stroke-width=".6" paint-order="stroke">
${letterA()}
${letterB(`stroke="var(--ivory)" stroke-width="3"`)}${letterB()}
<g clip-path="url(#${id}-weave)">${letterA(`stroke="var(--ivory)" stroke-width="3"`)}${letterA()}</g>
</g></svg>`;
}
