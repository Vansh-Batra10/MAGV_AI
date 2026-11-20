import type { Metadata } from "next";
import { SITES, SITE_KEYS, type SiteKey } from "@/config/markets";
import { SITE_URL, BRAND } from "@/config/brand";

/**
 * hreflang: Global English = "en" + x-default; India English & Hinglish = "en-IN" (Hinglish has no standard tag,
 * so it is treated as the India English variant — /in/en is canonical for en-IN, /in points to it); Hindi = "hi-IN".
 * See DECISIONS.md.
 */
export function alternates(path: string) {
  const p = path === "/" ? "" : path;
  return {
    canonical: undefined as string | undefined,
    languages: {
      en: `${SITE_URL}${p || "/"}`,
      "en-IN": `${SITE_URL}/in/en${p}`,
      "hi-IN": `${SITE_URL}/in/hi${p}`,
      "x-default": `${SITE_URL}${p || "/"}`,
    },
  };
}

export function siteMetadata(site: SiteKey, path: string, m: { title?: string; description?: string; noindex?: boolean } = {}): Metadata {
  const s = SITES[site];
  const p = path === "/" ? "" : path;
  const url = `${SITE_URL}${s.prefix}${p}` || SITE_URL;
  const description = m.description ?? (s.market === "IN"
    ? "Interactive digital gifts for couples, family and every festival — photos, letters, voice notes and group gifts. UPI, free preview, made in India."
    : "Interactive digital gifts for your person, your people and every celebration — photos, letters, voice notes and group gifts. Free preview.");
  const alt = alternates(path);
  return {
    title: m.title ? { absolute: m.title } : undefined,
    description,
    alternates: { canonical: url, languages: alt.languages },
    openGraph: { type: "website", url, siteName: BRAND.name, title: m.title ?? BRAND.name, description, images: [`/api/og-site?title=${encodeURIComponent(m.title ?? BRAND.tagline)}`], locale: s.locale === "hi" ? "hi_IN" : s.market === "IN" ? "en_IN" : "en_US" },
    twitter: { card: "summary_large_image" },
    robots: m.noindex ? { index: false } : undefined,
  };
}

export const ALL_SITES = SITE_KEYS;
