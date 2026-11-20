import "server-only";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isSiteKey, SITES, type SiteKey } from "@/config/markets";

export async function resolveSite(params: Promise<{ site: string }>) {
  const { site } = await params;
  if (!isSiteKey(site)) notFound();
  const s = SITES[site];
  setRequestLocale(s.locale);
  return { site: site as SiteKey, ...s, h: (p: string) => (s.prefix + (p === "/" ? "" : p)) || "/" };
}
