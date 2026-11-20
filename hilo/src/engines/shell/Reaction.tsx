"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Video, Square, Trash2, Send } from "lucide-react";
import type { GiftContext, RenderMode } from "@/templates/types";
import { uploadBlob } from "@/lib/client/upload";
import { BRAND } from "@/config/brand";

/**
 * Opt-in reaction capture (§8.9). Never records before an explicit tap + browser permission; visible indicator;
 * discard before sending; shared only with the sender unless the (unticked) public-use box is ticked.
 */
export function ReactionCapture({ ctx, mode }: { ctx: GiftContext; mode: RenderMode }) {
  const t = useTranslations("gift.reaction");
  const [state, setState] = useState<"idle" | "rec" | "review" | "sending" | "sent" | "failed">("idle");
  const [secs, setSecs] = useState(0);
  const [consent, setConsent] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const live = useRef<HTMLVideoElement>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const t0 = useRef(0);
  const sender = ctx.senderFirstName || "them";

  useEffect(() => () => stream.current?.getTracks().forEach((x) => x.stop()), []);
  if (mode !== "live" || !ctx.slug) return null;

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: true });
      stream.current = s;
      if (live.current) {
        live.current.srcObject = s;
        void live.current.play();
      }
      const mime = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported?.(m));
      const r = new MediaRecorder(s, mime ? { mimeType: mime, videoBitsPerSecond: 1_500_000 } : undefined);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        s.getTracks().forEach((x) => x.stop());
        const b = new Blob(chunks, { type: (r.mimeType || "video/webm").split(";")[0] });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setState("review");
      };
      rec.current = r;
      t0.current = Date.now();
      r.start(500);
      setState("rec");
      const id = setInterval(() => {
        const n = Math.floor((Date.now() - t0.current) / 1000);
        setSecs(n);
        if (n >= 15 || r.state !== "recording") {
          clearInterval(id);
          if (r.state === "recording") r.stop();
        }
      }, 250);
    } catch {
      setState("failed");
    }
  };
  const send = async () => {
    if (!blob) return;
    setState("sending");
    try {
      const u = await uploadBlob(blob, "reaction", { giftId: ctx.giftId });
      const r = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: ctx.slug, url: u, durationMs: Math.min(16000, secs * 1000), publicUseConsent: consent }) });
      setState(r.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="glass w-full max-w-[340px] p-4 text-center" onClick={(e) => e.stopPropagation()}>
      {state === "sent" ? <p className="text-mid">{t("sent", { name: sender })}</p> : state === "failed" ? (
        <div className="text-sm text-mid">
          <p>{t("failed")}</p>
          <p className="mt-1 text-xs text-lo">{t("openInBrowser")}</p>
          <p className="mt-2 text-xs">{t("voiceInstead")} ↑</p>
        </div>
      ) : state === "idle" ? (
        <>
          <p className="font-semibold text-hi">{t("title", { name: sender })}</p>
          <p className="mt-1 text-xs text-lo">{t("body", { name: sender })}</p>
          <button type="button" onClick={start} className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-hi"><Video size={16} /> {t("start")}</button>
        </>
      ) : (
        <>
          <div className="relative mx-auto aspect-[9/16] w-40 overflow-hidden rounded-2xl bg-black">
            {state === "rec" ? <video ref={live} muted playsInline className="h-full w-full -scale-x-100 object-cover" /> : url && <video src={url} controls playsInline className="h-full w-full object-cover" />}
            {state === "rec" && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {t("recording")} {secs}s</span>}
          </div>
          {state === "rec" ? (
            <button type="button" onClick={() => rec.current?.stop()} className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white"><Square size={14} fill="currentColor" /> {t("stop")}</button>
          ) : (
            <>
              <label className="mt-3 flex items-start gap-2 text-left text-xs text-mid"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-500" /> {t("consent", { brand: BRAND.name })}</label>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => { setBlob(null); setUrl(null); setState("idle"); }} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/8 text-sm text-mid"><Trash2 size={14} /> {t("discard")}</button>
                <button type="button" disabled={state === "sending"} onClick={send} className="flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-white [background:var(--grad-kiss)]"><Send size={14} /> {t("send", { name: sender })}</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
