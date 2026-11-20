"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const KEY = "hilo_consent";
type Choice = "all" | "essential";

function readChoice(): Choice | null {
  const m = document.cookie.match(/(?:^|; )hilo_consent=(all|essential)/);
  return (m?.[1] as Choice) ?? null;
}

/** Loads marketing/analytics tags ONLY after explicit consent. IDs come from public env vars. */
function loadTags() {
  const w = window as unknown as Record<string, unknown>;
  if (w.__hiloTags) return;
  w.__hiloTags = true;
  const add = (src: string) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  };
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  if (ga) {
    add(`https://www.googletagmanager.com/gtag/js?id=${ga}`);
    const dl = ((w.dataLayer as unknown[]) ??= []);
    const gtag = (...a: unknown[]) => dl.push(a);
    gtag("js", new Date());
    gtag("config", ga);
  }
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (pixel) {
    const f = function (...a: unknown[]) { ((f as unknown as { q: unknown[] }).q ??= []).push(a); } as unknown as Record<string, unknown>;
    w.fbq = f;
    add("https://connect.facebook.net/en_US/fbevents.js");
    (w.fbq as (...a: unknown[]) => void)("init", pixel);
    (w.fbq as (...a: unknown[]) => void)("track", "PageView");
  }
  const ph = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (ph) add(`${process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com"}/static/array.js`);
}

export function ConsentBanner() {
  const t = useTranslations("consent");
  const [show, setShow] = useState(false);
  useEffect(() => {
    const c = readChoice();
    if (c === "all") loadTags();
    if (!c) setTimeout(() => setShow(true), 1200);
    const reopen = () => setShow(true);
    window.addEventListener("hilo:consent", reopen);
    return () => window.removeEventListener("hilo:consent", reopen);
  }, []);
  const choose = (c: Choice) => {
    document.cookie = `${KEY}=${c}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setShow(false);
    if (c === "all") loadTags();
  };
  if (!show) return null;
  return (
    <div role="dialog" aria-label={t("title")} className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[80] mx-auto max-w-xl">
      <div className="glass-strong anim-rise p-5">
        <p className="font-display text-[22px] text-hi">{t("title")}</p>
        <p className="mt-1 text-sm leading-relaxed text-mid">{t("body")} <a href="/privacy" className="underline">{t("more")}</a></p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => choose("essential")} className="h-11 flex-1 rounded-full bg-white/8 text-sm font-semibold text-hi">{t("reject")}</button>
          <button type="button" onClick={() => choose("all")} className="h-11 flex-1 rounded-full text-sm font-semibold text-white [background:var(--grad-kiss)]">{t("accept")}</button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ label }: { label: string }) {
  return <button type="button" className="underline-offset-4 hover:underline" onClick={() => window.dispatchEvent(new Event("hilo:consent"))}>{label}</button>;
}
