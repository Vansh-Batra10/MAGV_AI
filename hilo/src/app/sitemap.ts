import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";
import { SITES, SITE_KEYS } from "@/config/markets";
import { landingOccasions } from "@/config/occasions";
import { liveTemplates } from "@/templates/registry";

/** One sitemap covering both editions, with hreflang alternates per URL. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = ["/", "/gifts", "/group", "/long-distance", "/pricing", "/reviews", "/about", "/contact", "/privacy", "/terms", "/refunds", "/delivery"];
  const out: MetadataRoute.Sitemap = [];
  for (const site of SITE_KEYS) {
    const s = SITES[site];
    const paths = [...base, ...landingOccasions(s.market).map((o) => `/gifts/${o.slug}`), ...liveTemplates().map((t) => `/t/${t.meta.slug}`)];
    for (const p of paths) {
      const tail = p === "/" ? "" : p;
      out.push({
        url: `${SITE_URL}${s.prefix}${tail}` || SITE_URL,
        changeFrequency: "weekly",
        priority: p === "/" ? 1 : p.startsWith("/gifts") ? 0.8 : 0.6,
        alternates: { languages: { en: `${SITE_URL}${tail || "/"}`, "en-IN": `${SITE_URL}/in/en${tail}`, "hi-IN": `${SITE_URL}/in/hi${tail}`, "x-default": `${SITE_URL}${tail || "/"}` } },
      });
    }
  }
  return out;
}
