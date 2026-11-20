"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function GiftFooter({ slug }: { slug: string }) {
  const t = useTranslations("gift.footer");
  const [open, setOpen] = useState<null | "takedown" | "abuse">(null);
  const [done, setDone] = useState(false);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const submit = async () => {
    await fetch("/api/takedown", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, kind: open, reason: reason || undefined, contact: contact || undefined }) });
    setDone(true);
    if (open === "takedown") setTimeout(() => location.reload(), 1500);
  };
  return (
    <>
      <div className="flex justify-center gap-4 bg-ink-950 py-4 text-[11px] text-white/35">
        <button type="button" className="underline-offset-4 hover:text-white/70 hover:underline" onClick={() => setOpen("takedown")}>{t("remove")}</button>
        <span aria-hidden>·</span>
        <button type="button" className="underline-offset-4 hover:text-white/70 hover:underline" onClick={() => setOpen("abuse")}>{t("report")}</button>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <div className="glass-strong w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-[28px] text-hi">{open === "takedown" ? t("removeTitle") : t("reportTitle")}</h2>
            {done ? (
              <p className="mt-3 text-mid" role="status">{open === "takedown" ? t("done") : t("reported")}</p>
            ) : (
              <>
                {open === "takedown" && <p className="mt-2 text-[15px] leading-relaxed text-mid">{t("removeBody")}</p>}
                <label className="mt-4 block text-sm text-mid">{t("reasonLabel")}
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-hi focus:outline-none" />
                </label>
                <label className="mt-3 block text-sm text-mid">{t("contactLabel")}
                  <input value={contact} onChange={(e) => setContact(e.target.value)} type="email" className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-hi focus:outline-none" />
                </label>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={submit} className={cn("h-12 flex-1 rounded-full font-semibold text-white", open === "takedown" ? "bg-rose-500" : "[background:var(--grad-kiss)]")}>{open === "takedown" ? t("submitRemove") : t("submitReport")}</button>
                  <button type="button" onClick={() => setOpen(null)} className="h-12 rounded-full px-5 text-mid">{t("cancel")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
