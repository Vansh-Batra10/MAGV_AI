"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Upload, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac"]) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return undefined;
}

/**
 * Records ≤ maxSec of audio. Falls back to "upload an audio file" and an "open in browser" helper when
 * MediaRecorder/getUserMedia is unavailable (common in Instagram/Facebook in-app browsers).
 */
export function VoiceRecorder({ maxSec = 60, onBlob, value, onClear, compact }: { maxSec?: number; onBlob: (b: Blob) => void | Promise<void>; value?: string | null; onClear?: () => void; compact?: boolean }) {
  const t = useTranslations("media");
  const [state, setState] = useState<"idle" | "recording" | "failed" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(24).fill(0.1));
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const [copied, setCopied] = useState(false);

  useEffect(() => () => stopRef.current(), []);

  const start = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const an = ac.createAnalyser();
      an.fftSize = 64;
      ac.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      let raf = 0;
      const loop = () => {
        an.getByteFrequencyData(data);
        setLevels(Array.from({ length: 24 }, (_, k) => Math.max(0.08, (data[k] ?? 0) / 255)));
        raf = requestAnimationFrame(loop);
      };
      loop();
      r.onstop = async () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ac.close();
        if (timer.current) clearInterval(timer.current);
        const blob = new Blob(chunks, { type: (r.mimeType || "audio/webm").split(";")[0] });
        setState("busy");
        try {
          await onBlob(blob);
        } finally {
          setState("idle");
        }
      };
      rec.current = r;
      r.start(250);
      setSecs(0);
      setState("recording");
      const t0 = Date.now();
      timer.current = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSecs(s);
        if (s >= maxSec) stop();
      }, 250);
      stopRef.current = stop;
    } catch {
      setState("failed");
    }
  };
  const stop = () => {
    if (rec.current?.state === "recording") rec.current.stop();
  };

  if (value && state !== "recording") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <audio src={value} controls className="h-10 min-w-0 flex-1" />
        {onClear && (
          <button type="button" onClick={onClear} className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-mid hover:text-hi" aria-label={t("rerecord")}>
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      {state === "failed" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-mid">
          <p className="mb-3 text-hi">{t("unsupported")}</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-4 font-semibold text-hi">
              <Upload size={16} /> {t("uploadInstead")}
              <input type="file" accept="audio/*" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setState("busy");
                  try { await onBlob(f); } finally { setState("idle"); }
                }
              }} />
            </label>
            <button type="button" onClick={async () => { await navigator.clipboard?.writeText(location.href); setCopied(true); }} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-mid hover:text-hi">
              <ExternalLink size={16} /> {copied ? t("linkCopied") : t("openInBrowser")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={state === "recording" ? stop : start}
            disabled={state === "busy"}
            className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-full text-white transition-all", state === "recording" ? "bg-rose-500 shadow-[0_0_0_8px_rgba(255,77,126,0.2)]" : "[background:var(--grad-kiss)]")}
            aria-label={state === "recording" ? t("stop") : t("record")}
          >
            {state === "recording" ? <Square size={18} fill="currentColor" /> : <Mic size={22} />}
          </button>
          <div className="flex h-10 flex-1 items-center gap-[3px]">
            {levels.map((l, k) => (
              <span key={k} className="w-full rounded-full bg-[var(--glow)] transition-[height] duration-100" style={{ height: `${state === "recording" ? l * 100 : 12}%`, opacity: state === "recording" ? 0.9 : 0.3 }} />
            ))}
          </div>
          <span className="w-14 text-right font-mono text-sm tabular-nums text-mid">
            {state === "busy" ? "…" : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}
          </span>
        </div>
      )}
      {!compact && state !== "failed" && <p className="text-xs text-lo">{t("maxSeconds", { n: maxSec })}</p>}
    </div>
  );
}
