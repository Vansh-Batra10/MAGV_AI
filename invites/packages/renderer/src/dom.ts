/** Tiny DOM helpers (no framework). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | number | boolean | undefined> = {}, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "class") el.className = String(v);
    else if (k === "style") el.setAttribute("style", String(v));
    else if (k === "text") el.textContent = String(v);
    else if (k === "html") el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const injected = new Set<string>();
export function ensureStyles(id: string, css: string): void {
  if (typeof document === "undefined" || injected.has(id) || document.getElementById(`inv-css-${id}`)) { injected.add(id); return; }
  const s = document.createElement("style");
  s.id = `inv-css-${id}`;
  s.textContent = css;
  document.head.appendChild(s);
  injected.add(id);
}

export function setVars(el: HTMLElement, tokens: Record<string, string>, prefix = "--"): void {
  for (const [k, v] of Object.entries(tokens)) el.style.setProperty(`${prefix}${k}`, v);
}

export function clamp(v: number, a: number, b: number): number { return Math.max(a, Math.min(b, v)); }
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
export function smooth(t: number): number { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); }

/** Canvas sized to its CSS box with a tier-capped DPR. */
export function makeCanvas(parent: HTMLElement, dpr: number, cls = ""): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; resize: () => { w: number; h: number } } {
  const canvas = h("canvas", { class: cls, "aria-hidden": "true" });
  parent.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), hh = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h: hh };
  };
  return { canvas, ctx, resize };
}

export function waitFrames(n = 2): Promise<void> {
  return new Promise((r) => { const f = () => (n-- <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
}
