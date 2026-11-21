/**
 * The frame clock. Ambient motion (sways, flickers, particles) is written as a pure function of time
 * `t` (seconds). In interactive mode `t` comes from the real clock; in autoplay/static mode it comes
 * from `seek()`, so the same frame renders identically every time.
 */
export type FrameFn = (t: number) => void;

export class Clock {
  private fns = new Set<FrameFn>();
  private raf = 0;
  private start = 0;
  private running = false;
  private paused = false;
  time = 0;
  /** Seconds since the clock started (interactive) or the seeked time (autoplay). */

  add(fn: FrameFn): () => void {
    this.fns.add(fn);
    return () => this.fns.delete(fn);
  }

  /** Render every registered function at time t (used by seek and by the rAF loop). */
  renderAt(t: number): void {
    this.time = t;
    for (const fn of this.fns) fn(t);
  }

  startRealtime(now: () => number = () => performance.now()): void {
    if (this.running) return;
    this.running = true;
    this.start = now() - this.time * 1000;
    const loop = () => {
      if (!this.running) return;
      if (!this.paused) this.renderAt((now() - this.start) / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setPaused(p: boolean, now: () => number = () => performance.now()): void {
    if (this.paused && !p) this.start = now() - this.time * 1000;
    this.paused = p;
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  clear(): void {
    this.fns.clear();
  }
}
