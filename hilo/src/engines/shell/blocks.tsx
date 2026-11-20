"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Heart as HeartIcon, MessageCircle, Mic, Send, Sparkles, Play, Pause } from "lucide-react";
import type { GiftContext, RenderMode } from "@/templates/types";
import { parseSong } from "@/lib/song";
import { BRAND } from "@/config/brand";
import { Heart, WaxSeal } from "@/components/art";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { haptic } from "@/lib/client/haptics";
import { sound } from "@/lib/client/sound";
import { uploadBlob } from "@/lib/client/upload";
import { cn } from "@/lib/cn";
import { initials } from "./util";
import confettiLib from "canvas-confetti";
import { ReactionCapture } from "./Reaction";

export async function confetti(opts: { colors?: string[]; particleCount?: number; spread?: number; origin?: { x: number; y: number }; shapes?: ("circle" | "square")[] } = {}) {
  confettiLib({ particleCount: opts.particleCount ?? 110, spread: opts.spread ?? 80, startVelocity: 42, origin: opts.origin ?? { x: 0.5, y: 0.6 }, colors: opts.colors ?? ["#FF4D7E", "#FFC870", "#C9B6FF", "#FFF8EF", "#FF8A65"], ticks: 220, scalar: 0.9, disableForReducedMotion: true });
}

export function heartBurst(container: HTMLElement | null, n = 14) {
  if (!container) return;
  for (let k = 0; k < n; k++) {
    const el = document.createElement("span");
    const a = (Math.PI * 2 * k) / n + Math.random() * 0.4;
    const d = 80 + Math.random() * 110;
    el.textContent = "♥";
    el.style.cssText = `position:absolute;left:50%;top:50%;font-size:${14 + Math.random() * 18}px;color:${["#FF4D7E", "#FF7A9C", "#FFC870"][k % 3]};pointer-events:none;transition:transform 1.1s cubic-bezier(.22,1,.36,1),opacity 1.1s;text-shadow:0 0 12px rgba(255,77,126,.8);z-index:50`;
    container.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(1.2)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 1200);
  }
}

/** Types text out letter by letter. In reduced motion it renders instantly. */
export function TypeOut({ text, speed = 32, className, onDone, start = true }: { text: string; speed?: number; className?: string; onDone?: () => void; start?: boolean }) {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    setN(0);
    done.current = false;
    const id = setInterval(() => setN((x) => (x >= text.length ? x : x + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  useEffect(() => {
    if (n >= text.length && !done.current && start) {
      done.current = true;
      onDone?.();
    }
  }, [n, text.length, onDone, start]);
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
      {n < text.length && <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current opacity-70" />}
    </span>
  );
}

const DEVANAGARI = /[ऀ-ॿ]/;
export function handFont(text?: string) {
  return text && DEVANAGARI.test(text) ? "var(--font-tiro), var(--font-kalam)" : "var(--font-kalam)";
}

/** A cream paper letter with the text typed in Kalam. */
export function LetterCard({ text, signoff, from, className, speed = 28, auto, onDone }: { text: string; signoff?: string; from?: string; className?: string; speed?: number; auto?: boolean; onDone?: () => void }) {
  return (
    <motion.div
      initial={{ y: 40, rotateX: 20, opacity: 0 }}
      animate={{ y: 0, rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn("paper relative mx-auto w-full max-w-[330px] rounded-[6px] px-6 pb-8 pt-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]", className)}
      style={{ backgroundImage: "repeating-linear-gradient(transparent 0 31px, rgba(160,120,90,0.14) 31px 32px), var(--grad-paper)" }}
    >
      <p className="whitespace-pre-line text-[19px] leading-[32px] text-ink-text" style={{ fontFamily: handFont(text) }}>
        <TypeOut text={text} speed={auto ? Math.max(12, speed / 2) : speed} onDone={onDone} />
      </p>
      {(signoff || from) && (
        <p className="mt-4 text-right text-[19px] text-[#a8123f]" style={{ fontFamily: handFont(from) }}>
          {signoff}
          {from ? <><br />— {from}</> : null}
        </p>
      )}
      <WaxSeal size={46} initials={initials(from)} className="absolute -bottom-5 left-1/2 -translate-x-1/2" />
    </motion.div>
  );
}

/** Our song: the official YouTube/Spotify embed, played only after a tap. Falls back to a title card. */
export function SongCard({ url, title, mode }: { url?: string; title?: string; mode: RenderMode }) {
  const t = useTranslations("gift");
  const song = parseSong(url);
  const [play, setPlay] = useState(false);
  if (!song) return null;
  const interactive = mode === "live" || mode === "preview";
  return (
    <div className="glass w-full max-w-[330px] overflow-hidden p-4">
      <p className="eyebrow mb-2 !text-[10px]">{t("ourSong")}</p>
      <p className="font-display text-[24px] italic leading-tight text-hi">{title || t("ourSongUntitled")}</p>
      {play && interactive ? (
        <iframe
          title={title || "song"}
          src={song.embedUrl}
          className="mt-3 w-full rounded-xl"
          style={{ height: song.provider === "spotify" ? 152 : 186, border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (interactive) {
              sound.setOn(false);
              setPlay(true);
            }
          }}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 font-semibold text-hi"
        >
          <Play size={16} fill="currentColor" /> {t("playSong")}
        </button>
      )}
      <a href={song.openUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 block text-center text-xs text-lo underline-offset-4 hover:underline">
        {t("openIn", { provider: song.provider === "youtube" ? "YouTube" : "Spotify" })}
      </a>
      {song.provider === "spotify" && <p className="mt-1 text-center text-[10px] text-lo">{t("spotifyPreviewNote")}</p>}
    </div>
  );
}

export function VoicePlayer({ src, label }: { src: string; label?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  const bars = useRef(Array.from({ length: 28 }, (_, k) => 0.25 + Math.abs(Math.sin(k * 1.7)) * 0.75));
  return (
    <div className="flex w-full items-center gap-3 rounded-full bg-black/30 p-2 pr-4 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label ?? "play"}
        onClick={() => {
          const a = ref.current!;
          if (a.paused) void a.play();
          else a.pause();
        }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white [background:var(--grad-kiss)]"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex h-8 flex-1 items-center gap-[3px]">
        {bars.current.map((h, k) => (
          <span key={k} className="w-full rounded-full transition-colors" style={{ height: `${h * 100}%`, background: k / bars.current.length < p ? "var(--glow)" : "rgba(255,255,255,0.25)" }} />
        ))}
      </div>
      <audio ref={ref} src={src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setP(0); }} onTimeUpdate={(e) => setP(e.currentTarget.currentTime / (e.currentTarget.duration || 1))} />
    </div>
  );
}

/** Final card on every gift: reply (heart / text / voice), keep-forever for 24h gifts, viral footer. */
export function ReplyCard({ ctx, mode, title, children, extra }: { ctx: GiftContext; mode: RenderMode; title?: ReactNode; children?: ReactNode; extra?: ReactNode }) {
  const t = useTranslations("gift");
  const [tab, setTab] = useState<"none" | "text" | "voice">("none");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const burstRef = useRef<HTMLDivElement>(null);
  const live = mode === "live" && !!ctx.sendReply;
  const sender = ctx.senderFirstName || t("theSender");

  const doSend = async (r: { kind: "heart" | "text" | "voice"; text?: string; voiceUrl?: string }) => {
    if (!live) {
      setSent(t("reply.previewNote"));
      return;
    }
    setBusy(true);
    try {
      await ctx.sendReply!(r);
      setSent(t("reply.sent", { name: sender }));
      setTab("none");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto px-6 pb-8 pt-16" onClick={(e) => e.stopPropagation()}>
      {children}
      <div ref={burstRef} className="glass-strong relative w-full max-w-[340px] p-5">
        <p className="text-center font-display text-[26px] leading-tight text-hi">{title ?? t("reply.title", { name: sender })}</p>
        {sent ? (
          <p role="status" className="mt-4 text-center text-[15px] text-mid">{sent}</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  haptic([10, 30, 10]);
                  sound.chime(1046, 0.8);
                  heartBurst(burstRef.current);
                  void doSend({ kind: "heart" });
                }}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-white/[0.06] text-xs font-semibold text-hi hover:bg-white/10"
              >
                <HeartIcon size={20} className="text-rose-500" fill="currentColor" /> {t("reply.heart")}
              </button>
              <button type="button" onClick={() => setTab(tab === "text" ? "none" : "text")} className={cn("flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold text-hi", tab === "text" ? "bg-white/15" : "bg-white/[0.06] hover:bg-white/10")}>
                <MessageCircle size={20} /> {t("reply.text")}
              </button>
              <button type="button" onClick={() => setTab(tab === "voice" ? "none" : "voice")} className={cn("flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold text-hi", tab === "voice" ? "bg-white/15" : "bg-white/[0.06] hover:bg-white/10")}>
                <Mic size={20} /> {t("reply.voice")}
              </button>
            </div>
            {tab === "text" && (
              <div className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="reply-text">{t("reply.placeholder")}</label>
                <textarea id="reply-text" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} rows={2} placeholder={t("reply.placeholder")} className="min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] text-hi placeholder:text-lo focus:outline-none" />
                <button type="button" disabled={!text.trim() || busy} onClick={() => doSend({ kind: "text", text: text.trim() })} className="grid h-12 w-12 shrink-0 place-items-center self-end rounded-full text-white [background:var(--grad-kiss)] disabled:opacity-40" aria-label={t("reply.send")}>
                  <Send size={18} />
                </button>
              </div>
            )}
            {tab === "voice" && (
              <div className="mt-3">
                <VoiceRecorder maxSec={30} compact onBlob={async (b) => {
                  if (!live) return void doSend({ kind: "voice" });
                  const url = await uploadBlob(b, "voice", { giftId: ctx.giftId });
                  await doSend({ kind: "voice", voiceUrl: url });
                }} />
              </div>
            )}
          </>
        )}
      </div>
      {extra}
      <ReactionCapture ctx={ctx} mode={mode} />
      {ctx.is24h && (
        <a href={ctx.slug ? `/g/${ctx.slug}/keep` : "#"} onClick={(e) => (mode !== "live" ? e.preventDefault() : undefined)} className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.7)]">
          <Sparkles size={16} /> {t("keepForever")}
        </a>
      )}
      <a href={mode === "live" ? `/gifts?utm_source=gift&utm_medium=footer` : "#"} onClick={(e) => { if (mode !== "live") return e.preventDefault(); void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "recipient_clicked_make_own", giftId: ctx.giftId }), keepalive: true }); }} className="text-[13px] text-white/50 underline-offset-4 hover:text-white/80 hover:underline">
        {ctx.isFree ? t("makeOne") : t("madeWith", { brand: BRAND.name })}
      </a>
    </div>
  );
}

export function FloatingHearts({ count = 10 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, k) => (
        <span key={k} className="absolute bottom-[-30px]" style={{ left: `${(k * 37) % 100}%`, animation: `rise-up ${7 + (k % 5)}s linear ${k * 0.7}s infinite` }}>
          <Heart size={10 + (k % 4) * 5} fill={["#FF4D7E", "#FF7A9C", "#FFC870"][k % 3]} style={{ opacity: 0.5 }} />
        </span>
      ))}
      <style>{`@keyframes rise-up{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.8}100%{transform:translateY(-900px) translateX(30px);opacity:0}}`}</style>
    </div>
  );
}
