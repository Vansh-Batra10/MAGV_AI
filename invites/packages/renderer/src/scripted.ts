import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RenderContext } from "./types";

let registered = false;
export function registerGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}
export { gsap, ScrollTrigger };

/**
 * A chapter is one scrubbed timeline (progress 0..1) plus its DOM section.
 * Interactive: pinned with ScrollTrigger (scrub 0.6, snap to end).
 * Scripted (video): the director plays each chapter's progress 0→1 over a fixed duration.
 */
export interface Chapter { id: string; el: HTMLElement; tl: gsap.core.Timeline; pinVh?: number }

export function pinChapters(ctx: RenderContext, chapters: Chapter[]): ScrollTrigger[] {
  registerGsap();
  if (ctx.reduced || ctx.lite) {
    // No scrubbing: show each chapter's end state and fade the info in when it scrolls into view.
    return chapters.map((c) => {
      c.tl.progress(1);
      return ScrollTrigger.create({ trigger: c.el, start: "top 80%", once: true, onEnter: () => ctx.emit("sceneView", `chapter:${c.id}`) });
    });
  }
  return chapters.map((c) =>
    ScrollTrigger.create({
      trigger: c.el,
      start: "top top",
      end: `+=${(c.pinVh ?? 140)}%`,
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      animation: c.tl,
      snap: { snapTo: [0, 1], duration: { min: 0.2, max: 0.6 }, delay: 0.1, inertia: false, directional: true },
      onEnter: () => ctx.emit("sceneView", `chapter:${c.id}`),
    }),
  );
}

/** A paused timeline that is safe to build in every mode. */
export function pausedTimeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  return gsap.timeline({ paused: true, ...vars });
}
