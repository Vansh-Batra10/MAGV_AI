"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { PhotoPicker } from "@/components/creator/PhotoPicker";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { uploadBlob } from "@/lib/client/upload";
import { BRAND } from "@/config/brand";
import { handFont, confetti } from "@/engines/shell/blocks";
import { trackClient } from "@/lib/client/track";

export function Contribute({ token, recipient, organiser, count, deadlineLabel, giftId }: { token: string; recipient: string; organiser: string; count: number; deadlineLabel: string | null; giftId: string }) {
  const t = useTranslations("contribute");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<string[]>([]);
  const [voice, setVoice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"form" | "busy" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setState("busy");
    setError(null);
    const r = await fetch("/api/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, name, message, photoUrl: photo[0] ?? null, voiceUrl: voice, contact: email ? { email } : undefined, consent: true }) });
    if (r.ok) {
      setState("done");
      void confetti();
    } else {
      setState("form");
      setError(r.status === 422 ? t("blocked") : t("error"));
    }
  };

  if (state === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <p className="font-display text-[56px] leading-none text-hi glow-text">{t("thanks")}</p>
        <p className="text-mid">{t("thanksSub", { name: recipient })}</p>
        <a href={`/create/quick-surprise?sender=${encodeURIComponent(name)}&utm_source=contributor&utm_medium=thanks`} onClick={() => trackClient("contributor_clicked_make_own", {}, giftId)} className="mt-4 flex h-14 items-center rounded-full px-7 font-semibold text-white [background:var(--grad-kiss)]">{t("makeOwn")}</a>
        <button type="button" onClick={() => { setState("form"); setMessage(""); setPhoto([]); setVoice(null); }} className="text-sm text-mid underline">{t("another")}</button>
      </motion.div>
    );
  }

  const field = "w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-[16px] text-hi placeholder:text-lo focus:border-rose-500/60 focus:outline-none";
  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <p className="eyebrow">{t("eyebrow", { name: recipient })}</p>
        <h1 className="mt-3 font-display text-[40px] leading-[1.05] text-hi md:text-[56px]">{t.rich("title", { organiser, name: recipient, em: (c) => <em className="text-rose-400">{c}</em> })}</h1>
        <p className="mt-3 text-mid">{t("sub", { name: recipient })}</p>
        <p className="mt-2 text-sm text-lo">{t("count", { n: count })}{deadlineLabel ? ` · ${deadlineLabel}` : ""}</p>
        <div className="glass mt-6 flex flex-col gap-5 p-5 md:p-6">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-hi">{t("name")}</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`${field} h-12`} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-hi">{t("message")}</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={5} placeholder={t("messagePh")} className={`${field} py-3 leading-relaxed`} />
            <span className="mt-1 block text-right text-xs tabular-nums text-lo">{message.length}/500</span>
          </label>
          <div><p className="mb-2 text-sm font-semibold text-hi">{t("photo")}</p><PhotoPicker value={photo} onChange={setPhoto} max={1} /></div>
          <div><p className="mb-2 text-sm font-semibold text-hi">{t("voice")}</p><VoiceRecorder maxSec={30} value={voice} onClear={() => setVoice(null)} onBlob={async (b) => setVoice(await uploadBlob(b, "voice", { contribToken: token }))} /></div>
          <label className="block"><span className="mb-1.5 block text-sm text-mid">{t("notify")}</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} h-12`} /></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.03] p-3 text-[13px] leading-relaxed text-mid">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-rose-500" />
            <span>{t.rich("consent", { brand: BRAND.name, link: (c) => <a href="/privacy" target="_blank" className="underline">{c}</a> })}</span>
          </label>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button type="button" onClick={submit} disabled={!name.trim() || (!message.trim() && !photo.length && !voice) || !consent || state === "busy"} className="flex h-14 items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] disabled:opacity-40">
            {state === "busy" && <Loader2 className="animate-spin" size={18} />} {t("submit")}
          </button>
        </div>
      </div>
      <aside className="md:sticky md:top-8 md:self-start">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("preview")}</p>
        <div className="relative rotate-[-2deg]">
          <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-rose-500 shadow-lg" />
          {photo[0] ? (
            <div className="rounded-[3px] bg-cream-50 p-2 pb-3 shadow-2xl">
              <img src={photo[0]} alt="" className="aspect-square w-full object-cover" />
              <p className="mt-2 px-1 text-[16px] leading-snug text-ink-text" style={{ fontFamily: handFont(message) }}>{message || "…"}</p>
              <p className="mt-1 px-1 text-right text-sm font-semibold text-[#a8123f]">— {name || "?"}</p>
            </div>
          ) : (
            <div className="min-h-[220px] rounded-[2px] bg-[#FFE4EC] p-5 shadow-2xl">
              <p className="whitespace-pre-line text-[19px] leading-snug text-ink-text" style={{ fontFamily: handFont(message) }}>{message || "…"}</p>
              <p className="mt-3 text-right text-sm font-semibold text-[#a8123f]">— {name || "?"}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
