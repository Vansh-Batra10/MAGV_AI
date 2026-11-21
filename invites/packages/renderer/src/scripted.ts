import { gsap } from "gsap";
import type { RenderContext } from "./types";

/** GSAP core only. Scroll pinning is done with CSS `position: sticky` + a tiny rAF scrubber (see below),
 *  which keeps ScrollTrigger (~17 KB gzip) out of the guest page and is cheaper on low-end phones. */
export function registerGsap(): typeof gsap { return gsap; }
export { gsap };

export interface Chapter { id: string; el: HTMLElement; tl: gsap.core.Timeline; pinVh?: number }
export interface ScrollHandle { kill(): void }

type Watch = { el: HTMLElement; range: () => [number, number]; cb: (p: number) => void; last: number };
const watches = new Set<Watch>();
let raf = 0;
function tick() {
  raf = 0;
  const vh = innerHeight;
  for (const w of watches) {
    const r = w.el.getBoundingClientRect();
    const [a, b] = w.range();
    const p = Math.max(0, Math.min(1, (vh * a - r.top) / Math.max(1, r.height * b)));
    if (p !== w.last) { w.last = p; w.cb(p); }
  }
}
function onScroll() { if (!raf) raf = requestAnimationFrame(tick); }

/** Calls `cb(progress 0..1)` as `el` scrolls; progress 0 when its top reaches `start`·viewport. */
export function scrollProgress(el: HTMLElement, cb: (p: number) => void, range: () => [number, number] = () => [1, 1]): ScrollHandle {
  const w: Watch = { el, range, cb, last: -1 };
  if (!watches.size) { addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); }
  watches.add(w);
  onScroll();
  return { kill() { watches.delete(w); if (!watches.size) { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); } } };
}

export function refreshScroll(): void { onScroll(); }

/**
 * Pinned, scrubbed chapters. Each chapter is wrapped in a track (100 + pinVh)vh tall; the chapter sticks to
 * the top while the track scrolls, and its timeline progress follows with a 0.6 s scrub smoothing.
 */
export function pinChapters(ctx: RenderContext, chapters: Chapter[]): ScrollHandle[] {
  return chapters.map((c) => {
    let seen = false;
    const view = () => { if (!seen) { seen = true; ctx.emit("sceneView", `chapter:${c.id}`); } };
    if (ctx.reduced || ctx.lite) {
      c.tl.progress(1);
      return scrollProgress(c.el, (p) => { if (p > 0) view(); }, () => [0.8, 1]);
    }
    const track = document.createElement("div");
    track.className = "inv-pin-track";
    track.style.height = `${100 + (c.pinVh ?? 140)}vh`;
    track.style.position = "relative";
    c.el.parentNode?.insertBefore(track, c.el);
    track.append(c.el);
    c.el.style.position = "sticky";
    c.el.style.top = "0";
    const proxy = { p: 0 };
    let tween: gsap.core.Tween | null = null;
    const h = scrollProgress(track, (p) => {
      if (p > 0) view();
      tween?.kill();
      tween = gsap.to(proxy, { p, duration: 0.6, ease: "power3.out", onUpdate: () => { c.tl.progress(proxy.p); } });
    }, () => [0, (track.offsetHeight - innerHeight) / Math.max(1, track.offsetHeight)]);
    return { kill() { h.kill(); tween?.kill(); } };
  });
}

/** A paused timeline that is safe to build in every mode. */
export function pausedTimeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  return gsap.timeline({ paused: true, ...vars });
}
