"use client";
/**
 * All UI sound is synthesised with Web Audio — we never ship copyrighted audio.
 * Sound is OFF until the first user gesture enables it.
 */
let ctx: AudioContext | null = null;
let enabled = false;
let ambient: { stop: () => void } | null = null;
const listeners = new Set<(on: boolean) => void>();

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const sound = {
  get on() {
    return enabled;
  },
  setOn(v: boolean) {
    enabled = v;
    if (v) ac();
    if (!v) ambient?.stop(), (ambient = null);
    listeners.forEach((l) => l(v));
  },
  subscribe(l: (on: boolean) => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  chime(freq = 880, dur = 1.2, gain = 0.12) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    [1, 2.01, 3.98].forEach((m, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq * m;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i + 1));
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur);
    });
  },
  bells() {
    [1318.5, 1568, 1760, 2093].forEach((f, i) => setTimeout(() => sound.chime(f, 1.6, 0.08), i * 180));
  },
  rustle(dur = 0.4) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2400;
    f.Q.value = 0.7;
    const g = c.createGain();
    g.gain.value = 0.18;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
  },
  pop() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.2);
    sound.rustle(0.15);
  },
  whoosh() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const dur = 0.6;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(400, c.currentTime);
    f.frequency.linearRampToValueAtTime(2200, c.currentTime + dur);
    const g = c.createGain();
    g.gain.value = 0.2;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
  },
  /** A soft, procedurally generated ambient pad (no copyrighted music). */
  ambient(mood: "warm" | "night" | "festive" = "night") {
    if (!enabled || ambient) return;
    const c = ac();
    if (!c) return;
    const roots = mood === "warm" ? [220, 277.18, 329.63] : mood === "festive" ? [261.63, 329.63, 392] : [196, 246.94, 293.66];
    const master = c.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.05, c.currentTime + 3);
    master.connect(c.destination);
    const oscs = roots.flatMap((f) =>
      [0, 3].map((det) => {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = det;
        const lfo = c.createOscillator();
        const lg = c.createGain();
        lfo.frequency.value = 0.07 + Math.random() * 0.05;
        lg.gain.value = 0.4;
        const g = c.createGain();
        g.gain.value = 0.5;
        lfo.connect(lg).connect(g.gain);
        o.connect(g).connect(master);
        o.start();
        lfo.start();
        return [o, lfo];
      }),
    );
    ambient = {
      stop() {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
        setTimeout(() => oscs.flat().forEach((o) => o.stop()), 900);
      },
    };
  },
};
