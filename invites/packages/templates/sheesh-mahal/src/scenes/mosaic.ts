import { makeCanvas, type PRNG } from "@invites/renderer";

/**
 * Sheesh Mahal mirror mosaic on canvas.
 * - The whole wall is a fine grid of seeded diamond mirror pieces, painted once into an offscreen buffer.
 * - A diagonal light sweep (one gradient fill per frame) travels across the wall.
 * - Tiles inside the couple-names box are redrawn every frame (A 900 / B 500 / C 220): those under the names
 *   mask brighten and hold as the sweep passes, so the names appear written in reflections.
 * Everything is a pure function of the state passed to render().
 */
export interface MosaicState {
  /** Light beam position 0..1 along the diagonal. */
  sweep: number;
  /** Reveal front 0..1: names behind it brighten and hold. */
  reveal: number;
  hold: number;
  dim: number;
  tilt: number;
  t: number;
}

interface Tile { x: number; y: number; pts: number[]; base: number; gold: boolean; phase: number; cover: number; d: number }

const STEPS = 40;
function mix(a: number[], b: number[], u: number) { return a.map((v, i) => Math.round(v + (b[i]! - v) * u)); }
function hex(h: string) { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export class Mosaic {
  canvas: HTMLCanvasElement;
  private c: CanvasRenderingContext2D;
  private buffer: HTMLCanvasElement;
  private all: Tile[] = [];
  private live: Tile[] = [];
  private sparkles: Tile[] = [];
  private w = 0;
  private h = 0;
  private step = 9;
  private silver: string[] = [];
  private gold: string[] = [];
  private plaster = "#0b0e26";
  private glow: number[] = [255, 200, 120];

  constructor(private host: HTMLElement, private rng: PRNG, private budget: number, private dpr: number) {
    const { canvas, ctx, resize } = makeCanvas(host, dpr, "sm-mosaic-canvas");
    this.canvas = canvas; this.c = ctx;
    const s = resize(); this.w = s.w; this.h = s.h;
    const cs = getComputedStyle(host);
    const tok = (n: string, d: string) => hex(cs.getPropertyValue(n).trim() || d);
    const mirror = tok("--mirror", "#DCE2EC"), sky = tok("--sky", "#141A45"), gold1 = tok("--gold-1", "#FFF1C2"), gold2 = tok("--gold-2", "#E8B64C");
    this.glow = tok("--glow", "#F3A23A");
    const deep = mix(sky, [0, 0, 0], 0.55);
    this.plaster = `rgb(${mix(deep, [0, 0, 0], 0.4).join(",")})`;
    for (let i = 0; i < STEPS; i++) {
      const u = i / (STEPS - 1);
      this.silver.push(`rgb(${(u < 0.5 ? mix(deep, mix(sky, mirror, 0.45), u / 0.5) : mix(mix(sky, mirror, 0.45), [255, 255, 255], (u - 0.5) / 0.5)).join(",")})`);
      this.gold.push(`rgb(${(u < 0.5 ? mix(deep, gold2, u / 0.5) : mix(gold2, gold1, (u - 0.5) / 0.5)).join(",")})`);
    }
    this.buffer = document.createElement("canvas");
    this.layout(null);
  }

  private grid(step: number, x0: number, y0: number, x1: number, y1: number, salt: string): Tile[] {
    const rng = this.rng.fork(salt);
    const out: Tile[] = [];
    const cx = this.w / 2, cy = this.h * 0.45;
    let row = 0;
    for (let y = y0; y < y1 + step; y += step * 0.866, row++) {
      for (let x = x0 + (row % 2 ? step * 0.5 : 0); x < x1 + step; x += step) {
        const rot = Math.PI / 4 + rng.range(-0.12, 0.12);
        const s = step * 0.6 * rng.range(0.88, 1.06);
        const pts: number[] = [];
        for (let k = 0; k < 4; k++) { const a = rot + (k * Math.PI) / 2; pts.push(x + Math.cos(a) * s, y + Math.sin(a) * s); }
        const r = Math.hypot(x - cx, (y - cy) * 0.85);
        const ang = Math.atan2(y - cy, x - cx);
        const rosette = Math.max(0, Math.cos(r / (step * 3.2)) * Math.cos(ang * 8));
        const ring = Math.abs(Math.sin(r / (step * 6))) > 0.97 ? 1 : 0;
        out.push({ x, y, pts, base: 0.16 + rosette * 0.14 + rng.range(0, 0.1) + ring * 0.12, gold: rng() > 0.82 || ring === 1, phase: rng.range(0, Math.PI * 2), cover: 0, d: (x / this.w) * 0.62 + (y / this.h) * 0.38 });
      }
    }
    return out;
  }

  private drawTile(c: CanvasRenderingContext2D, t: Tile, v: number, forceGold = false) {
    const idx = Math.max(0, Math.min(STEPS - 1, Math.round(v * (STEPS - 1))));
    c.fillStyle = (forceGold || t.gold) ? this.gold[idx]! : this.silver[idx]!;
    const p = t.pts;
    c.beginPath(); c.moveTo(p[0]!, p[1]!); c.lineTo(p[2]!, p[3]!); c.lineTo(p[4]!, p[5]!); c.lineTo(p[6]!, p[7]!); c.closePath(); c.fill();
  }

  /** Lay out the wall. `box` = names bounding box (host coords) for the live tile set. */
  private layout(box: { x: number; y: number; w: number; h: number } | null): void {
    const { w, h } = this;
    const area = box ? box.w * box.h : w * h * 0.25;
    this.step = Math.max(6.5, Math.min(18, Math.sqrt(area / (this.budget * 0.866))));
    this.all = this.grid(this.step, 0, this.step * 0.5, w, h, "wall");
    // Static buffer
    this.buffer.width = Math.round(w * this.dpr); this.buffer.height = Math.round(h * this.dpr);
    const b = this.buffer.getContext("2d")!;
    b.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    b.fillStyle = this.plaster; b.fillRect(0, 0, w, h);
    for (const t of this.all) this.drawTile(b, t, t.base);
    // soft highlight on each piece (convex mirror look)
    b.globalCompositeOperation = "lighter";
    b.fillStyle = "rgba(255,255,255,.05)";
    for (const t of this.all) b.fillRect(t.x - this.step * 0.18, t.y - this.step * 0.22, this.step * 0.22, this.step * 0.14);
    b.globalCompositeOperation = "source-over";
    this.live = box ? this.all.filter((t) => t.x > box.x - this.step && t.x < box.x + box.w + this.step && t.y > box.y - this.step && t.y < box.y + box.h + this.step) : [];
    const rng = this.rng.fork("sparkle");
    this.sparkles = Array.from({ length: 70 }, () => this.all[Math.floor(rng() * this.all.length)]!).filter(Boolean);
  }

  /** Rasterise the names (using the real DOM elements' font and position) and sample coverage per tile. */
  setMask(els: HTMLElement[]): void {
    const hostRect = this.host.getBoundingClientRect();
    const rects = els.map((e) => e.getBoundingClientRect());
    const x = Math.min(...rects.map((r) => r.left)) - hostRect.left, y = Math.min(...rects.map((r) => r.top)) - hostRect.top;
    const x2 = Math.max(...rects.map((r) => r.right)) - hostRect.left, y2 = Math.max(...rects.map((r) => r.bottom)) - hostRect.top;
    this.layout({ x, y, w: x2 - x, h: y2 - y });
    const off = document.createElement("canvas");
    off.width = Math.ceil(this.w); off.height = Math.ceil(this.h);
    const o = off.getContext("2d")!;
    o.fillStyle = "#fff";
    for (const el of els) {
      const cs = getComputedStyle(el);
      o.font = `${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
      o.textAlign = "center"; o.textBaseline = "middle";
      for (const line of layoutLines(el)) o.fillText(line.text, line.cx - hostRect.left, line.cy - hostRect.top);
    }
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const sample = (sx: number, sy: number) => {
      const xi = Math.round(sx), yi = Math.round(sy);
      if (xi < 0 || yi < 0 || xi >= off.width || yi >= off.height) return 0;
      return data[(yi * off.width + xi) * 4 + 3]! / 255;
    };
    for (const t of this.live) {
      let s = sample(t.x, t.y) * 2;
      for (let k = 0; k < 4; k++) s += sample((t.x * 2 + t.pts[k * 2]!) / 3, (t.y * 2 + t.pts[k * 2 + 1]!) / 3);
      t.cover = Math.min(1, s / 4.5);
    }
  }

  render(st: MosaicState): void {
    const { c, w, h } = this;
    c.drawImage(this.buffer, 0, 0, w, h);
    // light sweep across the whole wall
    const s = -0.25 + st.sweep * 1.5 + st.tilt * 0.25;
    const beamAt = (d: number) => { const dd = (d - s) / 0.1; return Math.exp(-dd * dd); };
    const dx = w * 0.62, dy = h * 0.38, len2 = dx * dx + dy * dy;
    const gx = (dx * w) / len2, gy = (dy * h) / len2;
    const g = c.createLinearGradient(0, 0, gx * w, gy * h);
    const [r, gg, b] = this.glow;
    const amp = 0.55 * (1 - st.dim * 0.6);
    for (const off of [-0.2, -0.1, 0, 0.1, 0.2]) {
      const pos = Math.min(1, Math.max(0, s + off));
      g.addColorStop(pos, `rgba(${r},${gg},${b},${(amp * Math.exp(-((off / 0.1) ** 2))).toFixed(3)})`);
    }
    c.globalCompositeOperation = "lighter";
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    if (st.dim > 0) { c.fillStyle = `rgba(4,5,18,${(st.dim * 0.62).toFixed(3)})`; c.fillRect(0, 0, w, h); }
    // live tiles: names written in reflections
    const rv = -0.25 + st.reveal * 1.5;
    for (const t of this.live) {
      if (t.cover < 0.08) continue;
      const passed = t.d < rv ? 1 : Math.exp(-(t.d - rv) * 28);
      const glow = t.cover * st.hold * passed;
      if (glow < 0.02) continue;
      const v = Math.min(1, t.base * (1 - glow) + glow * (0.78 + 0.12 * Math.sin(st.t * 2.4 + t.phase)) + beamAt(t.d) * 0.3);
      this.drawTile(c, t, v, true);
    }
    // sparkles (pure function of t)
    c.fillStyle = "#fff";
    for (let i = 0; i < this.sparkles.length; i++) {
      const t = this.sparkles[i]!;
      const a = Math.pow(Math.max(0, Math.sin(st.t * (1.1 + (i % 5) * 0.37) + t.phase)), 6) * (1 - st.dim * 0.5) + beamAt(t.d) * 0.8;
      if (a < 0.05) continue;
      c.globalAlpha = Math.min(1, a);
      const z = this.step * 0.35;
      c.fillRect(t.x - z, t.y - 0.5, z * 2, 1);
      c.fillRect(t.x - 0.5, t.y - z, 1, z * 2);
    }
    c.globalAlpha = 1;
  }
}

/** The visual lines of an element's text (soft wraps included), with each line's centre. */
export function layoutLines(el: HTMLElement): { text: string; cx: number; cy: number }[] {
  const node = el.firstChild;
  if (!node || node.nodeType !== 3) { const r = el.getBoundingClientRect(); return [{ text: el.textContent ?? "", cx: r.left + r.width / 2, cy: r.top + r.height / 2 }]; }
  const text = node.textContent ?? "";
  const range = document.createRange();
  const lines: { words: string[]; top: number; left: number; right: number; bottom: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
    const r = range.getBoundingClientRect();
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.top - r.top) < r.height * 0.5) { last.words.push(m[0]); last.right = r.right; last.bottom = Math.max(last.bottom, r.bottom); }
    else lines.push({ words: [m[0]], top: r.top, left: r.left, right: r.right, bottom: r.bottom });
  }
  return lines.map((l) => ({ text: l.words.join(" "), cx: (l.left + l.right) / 2, cy: (l.top + l.bottom) / 2 + (l.bottom - l.top) * 0.02 }));
}
