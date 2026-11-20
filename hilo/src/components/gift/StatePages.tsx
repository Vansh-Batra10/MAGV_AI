"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Starfield } from "@/components/ui/Starfield";
import { LogoMark } from "@/components/ui/Logo";
import { Envelope } from "@/components/art";

function Frame({ children, glow = "rose" }: { children: React.ReactNode; glow?: string }) {
  return (
    <main data-glow={glow} className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-0 [background:var(--grad-aurora)]" />
      <Starfield density={0.7} />
      <div className="relative z-10 flex max-w-md flex-col items-center gap-5">{children}</div>
    </main>
  );
}

export function PasswordGate({ slug, senderFirstName }: { slug: string; senderFirstName: string }) {
  const t = useTranslations("gift.password");
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Frame>
      <Envelope size={170} />
      <h1 className="font-display text-[38px] leading-tight text-hi">{t("title")}</h1>
      <p className="text-mid">{t("body", { name: senderFirstName })}</p>
      <form
        className="glass mt-2 flex w-full flex-col gap-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await fetch("/api/g/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, password: pw }) });
          setBusy(false);
          if (r.ok) router.refresh();
          else setError(r.status === 429 ? t("tooMany") : t("wrong"));
        }}
      >
        <label className="sr-only" htmlFor="gpw">{t("label")}</label>
        <input id="gpw" type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("label")} className="h-14 rounded-2xl border border-white/10 bg-black/30 px-4 text-center text-[17px] text-hi focus:outline-none" />
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy || !pw} className="h-14 rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] disabled:opacity-50">{t("open")}</button>
      </form>
    </Frame>
  );
}

export function ExpiredPage({ slug, senderFirstName }: { slug: string; senderFirstName: string }) {
  const t = useTranslations("gift.expired");
  const [asked, setAsked] = useState(false);
  return (
    <Frame glow="lavender">
      <div className="opacity-50 grayscale"><Envelope size={170} /></div>
      <h1 className="font-display text-[40px] leading-tight text-hi">{t("title")}</h1>
      <p className="text-mid">{t("body", { name: senderFirstName })}</p>
      <div className="flex w-full flex-col gap-3">
        <button type="button" disabled={asked} onClick={async () => { await fetch("/api/g/bring-back", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }); setAsked(true); }} className="h-14 rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] disabled:opacity-70">
          {asked ? t("asked", { name: senderFirstName }) : t("ask", { name: senderFirstName })}
        </button>
        <a href="/gifts?utm_source=gift&utm_medium=expired" className="flex h-14 items-center justify-center rounded-full border border-white/12 bg-white/5 font-semibold text-hi">{t("makeOwn")}</a>
      </div>
    </Frame>
  );
}

export function RemovedPage() {
  const t = useTranslations("gift.removed");
  return (
    <Frame>
      <LogoMark size={64} />
      <h1 className="font-display text-[36px] text-hi">{t("title")}</h1>
      <p className="text-mid">{t("body")}</p>
    </Frame>
  );
}

export function NotYetPage({ when }: { when: string }) {
  const t = useTranslations("gift.notYet");
  return (
    <Frame glow="amber">
      <Envelope size={170} />
      <h1 className="font-display text-[42px] text-hi">{t("title")}</h1>
      <p className="text-mid">{t("body", { date: when })}</p>
    </Frame>
  );
}
