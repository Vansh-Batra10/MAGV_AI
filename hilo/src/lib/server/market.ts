import "server-only";
import { cookies } from "next/headers";
import { q } from "./db";
import { SITES, type SiteKey, type Currency } from "@/config/markets";
import { PRICES, formatMoney, durationsFor } from "@/config/pricing";
import { liveTemplates } from "@/templates/registry";
import { landingOccasions, OCCASIONS } from "@/config/occasions";
import type { GalleryItem } from "@/components/marketing/GalleryGrid";

export async function siteCurrency(site: SiteKey): Promise<Currency> {
  const c = (await cookies()).get("hilo_currency")?.value;
  if (c === "INR" || c === "USD") return c;
  return SITES[site].market === "IN" ? "INR" : "USD";
}

export function fromPrice(tier: string, currency: Currency): number | null {
  if (tier === "free") return 0;
  const t = PRICES[currency][tier as keyof (typeof PRICES)["INR"]];
  const vals = Object.values(t ?? {}).filter((v): v is number => typeof v === "number");
  return vals.length ? Math.min(...vals) : null;
}

export async function galleryItems(site: SiteKey, currency: Currency, tFrom: (p: string) => string, freeLabel: string): Promise<GalleryItem[]> {
  const market = SITES[site].market;
  let off = new Set<string>();
  try {
    off = new Set((await q<{ slug: string }>(`select slug from template_flags where enabled=false`)).map((r) => r.slug));
  } catch {}
  return liveTemplates()
    .filter((t) => !off.has(t.meta.slug))
    .filter((t) => market === "IN" || t.meta.occasion.some((o) => OCCASIONS.find((x) => x.slug === o)?.markets.includes("GLOBAL")))
    .map((t) => {
      const p = fromPrice(t.meta.tier, currency);
      void durationsFor;
      return { slug: t.meta.slug, occasion: t.meta.occasion, moods: t.meta.moods, relations: t.meta.relations, mode: t.meta.mode, priceLabel: t.meta.tier === "free" ? freeLabel : p !== null ? tFrom(formatMoney(p, currency)) : "" };
    });
}

export function filterOccasions(site: SiteKey, lang: "en" | "hi-Latn" | "hi") {
  return landingOccasions(SITES[site].market).map((o) => ({ slug: o.slug, name: o.name[lang] }));
}
