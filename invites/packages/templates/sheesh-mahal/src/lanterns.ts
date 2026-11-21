import type { PRNG } from "@invites/renderer";

/** Sky lanterns: one per confirmed household (never names). Pure function of time. */
const LANTERN = `<svg viewBox="0 0 20 28" aria-hidden="true"><defs><radialGradient id="sm-lan" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#FFF2C2"/><stop offset=".5" stop-color="#FFB347"/><stop offset="1" stop-color="#C8561C"/></radialGradient></defs><path d="M3,2 Q10,-1 17,2 L19,22 Q10,26 1,22 Z" fill="url(#sm-lan)"/><path d="M6,25 h8" stroke="#FFD27A" stroke-width="1.4"/></svg>`;

export interface LanternField { el: HTMLElement; render(t: number): void; add(): HTMLElement }

export function lanternField(host: HTMLElement, rng: PRNG, count: number, opts: { maxDom?: number } = {}): LanternField {
  const el = document.createElement("div");
  el.className = "sm-lanterns";
  host.append(el);
  const items: { node: HTMLElement; x: number; y0: number; speed: number; sway: number; phase: number; scale: number }[] = [];
  const make = (i: number) => {
    const node = document.createElement("i");
    node.innerHTML = LANTERN;
    const scale = 0.45 + rng() * 0.9;
    const it = { node, x: rng.range(4, 92), y0: rng.range(0, 1), speed: 0.012 + rng() * 0.02 * scale, sway: rng.range(4, 14), phase: rng.range(0, 6.28), scale };
    node.style.width = `${(18 * scale).toFixed(1)}px`;
    node.style.zIndex = String(Math.round(scale * 10));
    node.style.opacity = (0.55 + scale * 0.4).toFixed(2);
    el.append(node);
    items.push(it);
    void i;
    return node;
  };
  const n = Math.min(count, opts.maxDom ?? 40);
  for (let i = 0; i < n; i++) make(i);
  return {
    el,
    render(t) {
      const h = el.clientHeight || 600;
      for (const it of items) {
        const p = (it.y0 + t * it.speed) % 1.15;
        const y = h * (1.05 - p);
        const x = it.x + Math.sin(t * 0.6 + it.phase) * it.sway * 0.1;
        it.node.style.transform = `translate3d(${x.toFixed(2)}cqw, ${y.toFixed(1)}px, 0) rotate(${(Math.sin(t * 0.8 + it.phase) * 4).toFixed(2)}deg)`;
      }
    },
    add() { return make(items.length); },
  };
}

export const LANTERN_CSS = `
.sm-lanterns{position:absolute;inset:0;overflow:hidden;pointer-events:none;container-type:inline-size}
.sm-lanterns i{position:absolute;left:0;top:0;display:block;filter:drop-shadow(0 0 6px rgba(255,180,80,.8))}
.sm-lanterns svg{width:100%;height:auto;display:block}
.sm-sky{position:relative;height:72svh;min-height:420px;overflow:hidden;background:linear-gradient(180deg,#070A24,var(--sky) 45%,var(--sky2) 80%,var(--horizon));display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 20px 22%}
.sm-sky h2{font-family:"Rozha One",serif;font-weight:400;font-size:calc(34px*var(--inv-text-scale));margin:0;color:var(--ivory);position:relative;z-index:12;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.sm-sky p{position:relative;z-index:12;margin:6px 0 0;color:var(--ivory);opacity:.9}
.sm-sky-palace{position:absolute;left:0;right:0;bottom:0;height:26%;pointer-events:none}
.sm-sky-palace svg{width:100%;height:100%;display:block}
.sm-handdiya{position:absolute;left:50%;bottom:22%;width:46px;margin-left:-23px;z-index:13;opacity:0;pointer-events:none}
.sm-jharokha-diya{position:absolute;left:50%;bottom:8%;width:40px;margin-left:-20px;z-index:13;opacity:0}
.sm-potli{display:flex;justify-content:center;margin:4px 0 10px}
.sm-potli svg{width:120px;height:120px}
`;
