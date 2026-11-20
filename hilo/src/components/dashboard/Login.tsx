"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export function Login({ next }: { next: string }) {
  const t = useTranslations("login");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [dev, setDev] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const field = "h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-[17px] text-hi focus:border-rose-500/60 focus:outline-none";
  return (
    <div className="glass-strong mx-auto max-w-md p-6 md:p-8">
      <h1 className="font-display text-[44px] leading-none text-hi">{t("title")}</h1>
      <p className="mt-2 text-mid">{t("sub")}</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={async (e) => {
        e.preventDefault();
        setErr(false);
        if (!sent) {
          const r = await fetch("/api/auth/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, lang: locale }) });
          if (r.ok) { const j = await r.json(); setSent(true); setDev(j.devCode ?? null); }
        } else {
          const r = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
          if (r.ok) { router.push(next); router.refresh(); } else setErr(true);
        }
      }}>
        <label className="sr-only" htmlFor="em">{t("email")}</label>
        <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} className={field} disabled={sent} />
        {sent && <><label className="sr-only" htmlFor="code">{t("code")}</label><input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder={t("code")} className={`${field} text-center font-mono tracking-[0.5em]`} autoFocus /></>}
        {dev && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-300" data-testid="dev-code">{t("devCode", { code: dev })}</p>}
        {err && <p role="alert" className="text-sm text-rose-400">{t("wrong")}</p>}
        <button className="h-14 rounded-full font-semibold text-white [background:var(--grad-kiss)]">{sent ? t("verify") : t("send")}</button>
      </form>
      <p className="mt-4 text-xs text-lo">{t("google")}</p>
    </div>
  );
}
