/**
 * Audio manager (§5.3). Web Audio only; unlocks on the first user gesture; mute persisted;
 * one ambient bed + short stings with ducking. Sound never autoplays.
 *
 * v1 sounds are synthesised procedurally (zero bytes to download, no licensing). A template can
 * register recorded audio later via `registerBuffer(id, url)` once a licence file exists in /licenses.
 */
export type SoundId = string;
export type Synth = (ac: AudioContext, out: AudioNode, at: number) => number | void; // returns duration (s)

const MUTE_KEY = "inv:muted";

function safeGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* private mode */ } }

export class AudioManager {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private bedGain: GainNode | null = null;
  private synths = new Map<SoundId, Synth>();
  private buffers = new Map<SoundId, AudioBuffer>();
  private bedStop: (() => void) | null = null;
  private listeners = new Set<(muted: boolean) => void>();
  muted: boolean;
  enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
    this.muted = safeGet(MUTE_KEY) === "1";
  }

  register(id: SoundId, synth: Synth): void { this.synths.set(id, synth); }

  async registerBuffer(id: SoundId, url: string): Promise<void> {
    if (!this.ac) return;
    const res = await fetch(url);
    this.buffers.set(id, await this.ac.decodeAudioData(await res.arrayBuffer()));
  }

  /** Call from a user gesture handler. Safe to call repeatedly. */
  unlock(): void {
    if (!this.enabled) return;
    if (!this.ac) {
      const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ac.destination);
      this.bedGain = this.ac.createGain();
      this.bedGain.gain.value = 0.35;
      this.bedGain.connect(this.master);
    }
    if (this.ac.state === "suspended") void this.ac.resume();
  }

  get unlocked(): boolean { return !!this.ac && this.ac.state === "running"; }

  setMuted(m: boolean): void {
    this.muted = m;
    safeSet(MUTE_KEY, m ? "1" : "0");
    if (this.ac && this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ac.currentTime, 0.05);
    for (const l of this.listeners) l(m);
  }

  onMuteChange(fn: (m: boolean) => void): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /** Play a short sting; ducks the ambient bed while it plays. */
  sting(id: SoundId): void {
    if (!this.ac || !this.master || !this.enabled) return;
    const at = this.ac.currentTime + 0.01;
    let dur = 1.5;
    const buf = this.buffers.get(id);
    if (buf) {
      const src = this.ac.createBufferSource();
      src.buffer = buf; src.connect(this.master); src.start(at); dur = buf.duration;
    } else {
      const s = this.synths.get(id);
      if (!s) return;
      dur = (s(this.ac, this.master, at) as number) || dur;
    }
    if (this.bedGain) {
      const g = this.bedGain.gain;
      g.cancelScheduledValues(at);
      g.setTargetAtTime(0.12, at, 0.08);
      g.setTargetAtTime(0.35, at + dur, 0.6);
    }
  }

  /** Start (or switch) the ambient bed. The bed synth must loop itself and return a stop fn via `bedLoop`. */
  bed(loop: (ac: AudioContext, out: AudioNode) => () => void): void {
    if (!this.ac || !this.bedGain || !this.enabled) return;
    this.bedStop?.();
    this.bedStop = loop(this.ac, this.bedGain);
  }

  destroy(): void {
    this.bedStop?.();
    void this.ac?.close();
    this.ac = null;
    this.listeners.clear();
  }
}

// ---------- A small library of synthesised instruments ----------

function env(g: GainNode, at: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
}

/** Reed-like (shehnai-ish) phrase: sawtooth through a bandpass, with vibrato and glides. */
export function reedPhrase(notes: [number, number][], gain = 0.18): Synth {
  return (ac, out, at) => {
    const osc = ac.createOscillator(); osc.type = "sawtooth";
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 1.2;
    const lfo = ac.createOscillator(); lfo.frequency.value = 5.5;
    const lfoG = ac.createGain(); lfoG.gain.value = 6;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    const g = ac.createGain(); g.gain.value = 0.0001;
    osc.connect(bp); bp.connect(g); g.connect(out);
    let t = at;
    osc.frequency.setValueAtTime(notes[0]![0], t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.12);
    for (const [f, d] of notes) { osc.frequency.exponentialRampToValueAtTime(f, t + 0.08); t += d; }
    g.gain.setValueAtTime(gain, t - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.start(at); lfo.start(at); osc.stop(t + 0.5); lfo.stop(t + 0.5);
    return t - at + 0.5;
  };
}

/** Plucked string (santoor-ish): a few decaying partials. */
export function pluck(freq: number, gain = 0.12, decay = 1.6): Synth {
  return (ac, out, at) => {
    for (const [mult, amp] of [[1, 1], [2.01, 0.4], [3.02, 0.18], [4.2, 0.08]] as const) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq * mult;
      const g = ac.createGain(); env(g, at, 0.004, gain * amp, decay / mult);
      o.connect(g); g.connect(out); o.start(at); o.stop(at + decay + 0.1);
    }
    return decay;
  };
}

export function arpeggio(freqs: number[], step = 0.14, gain = 0.1): Synth {
  return (ac, out, at) => { freqs.forEach((f, i) => pluck(f, gain)(ac, out, at + i * step)); return freqs.length * step + 1.6; };
}

/** Drum hit (dholak-ish): pitched thump + noise slap. */
export function drum(freq = 110, gain = 0.4, slap = 0.15): Synth {
  return (ac, out, at) => {
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(freq * 1.6, at); o.frequency.exponentialRampToValueAtTime(freq, at + 0.08);
    const g = ac.createGain(); env(g, at, 0.003, gain, 0.35);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.5);
    noiseBurst(0.06, slap, 2500)(ac, out, at);
    return 0.5;
  };
}

export function noiseBurst(dur: number, gain: number, cutoff: number, type: BiquadFilterType = "highpass"): Synth {
  return (ac, out, at) => {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = (seed / 0x7fffffff * 2 - 1) * (1 - i / len); }
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = cutoff;
    const g = ac.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(out); src.start(at);
    return dur;
  };
}

/** Bell / coin clink. */
export function clink(freq = 2400, gain = 0.12): Synth {
  return (ac, out, at) => {
    for (const m of [1, 1.47, 2.09]) {
      const o = ac.createOscillator(); o.frequency.value = freq * m;
      const g = ac.createGain(); env(g, at, 0.002, gain / m, 0.5);
      o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.6);
    }
    return 0.6;
  };
}

/** Tanpura-like drone bed: detuned sines with slow swell. Returns a stop function. */
export function droneBed(root = 146.83): (ac: AudioContext, out: AudioNode) => () => void {
  return (ac, out) => {
    const nodes: OscillatorNode[] = [];
    const g = ac.createGain(); g.gain.value = 0.0001; g.connect(out);
    g.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 3);
    for (const [f, a] of [[root, 1], [root * 1.5, 0.5], [root * 2, 0.6], [root * 2.003, 0.4], [root * 0.5, 0.5]] as const) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const og = ac.createGain(); og.gain.value = a;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.1 + a * 0.07;
      const lg = ac.createGain(); lg.gain.value = a * 0.3;
      lfo.connect(lg); lg.connect(og.gain);
      o.connect(og); og.connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    }
    return () => { g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3); setTimeout(() => nodes.forEach((n) => n.stop()), 1200); };
  };
}

/** A repeating rhythm loop (e.g. dholak theka). Returns a stop function. */
export function rhythmBed(pattern: (0 | 1 | 2)[], bpm = 96): (ac: AudioContext, out: AudioNode) => () => void {
  return (ac, out) => {
    let stopped = false;
    const step = 60 / bpm / 2;
    let next = ac.currentTime + 0.05, i = 0;
    const tick = () => {
      if (stopped) return;
      while (next < ac.currentTime + 0.3) {
        const p = pattern[i % pattern.length];
        if (p === 1) drum(98, 0.25, 0.05)(ac, out, next);
        if (p === 2) drum(220, 0.12, 0.18)(ac, out, next);
        next += step; i++;
      }
      setTimeout(tick, 100);
    };
    tick();
    return () => { stopped = true; };
  };
}

// Sa = D3
export const SWARAS = { Sa: 146.83, Re: 164.81, Ga: 185.0, Ma: 196.0, Pa: 220.0, Dha: 246.94, Ni: 277.18, Sa2: 293.66, Re2: 329.63, Ga2: 369.99 };
