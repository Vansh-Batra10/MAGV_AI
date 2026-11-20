"use client";
import { useTranslations } from "next-intl";
import { SITES, SITE_KEYS, type SiteKey } from "@/config/markets";
import { useSite } from "./SiteContext";

export function RegionSwitcher({ path }: { path: string }) {
  const t = useTranslations("footer");
  const { site } = useSite();
  const go = (s: SiteKey) => {
    document.cookie = `hilo_site=${s}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `hilo_lang=${SITES[s].locale}; path=/; max-age=31536000; samesite=lax`;
    location.href = (SITES[s].prefix + (path === "/" ? "" : path)) || "/";
  };
  const setCur = (c: string) => {
    document.cookie = `hilo_currency=${c}; path=/; max-age=31536000; samesite=lax`;
    location.reload();
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs text-lo" htmlFor="region">{t("region")}</label>
      <select id="region" value={site} onChange={(e) => go(e.target.value as SiteKey)} className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-hi">
        {SITE_KEYS.map((s) => <option key={s} value={s} className="bg-ink-900">{SITES[s].label}</option>)}
      </select>
      <label className="text-xs text-lo" htmlFor="currency">{t("currency")}</label>
      <select id="currency" defaultValue="" onChange={(e) => setCur(e.target.value)} className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-hi">
        <option value="" className="bg-ink-900">Auto</option>
        <option value="INR" className="bg-ink-900">INR</option>
        <option value="USD" className="bg-ink-900">USD</option>
      </select>
    </div>
  );
}
