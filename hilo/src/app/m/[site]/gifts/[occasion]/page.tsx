import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { siteCurrency, galleryItems } from "@/lib/server/market";
import { occasionBySlug, nextOccurrence, daysUntil, RELEASE } from "@/config/occasions";
import { PageHero } from "@/components/marketing/PageHero";
import { GalleryGrid } from "@/components/marketing/GalleryGrid";
import { ButtonLink } from "@/components/ui/Button";
import { siteMetadata } from "@/lib/seo";
import { now } from "@/lib/server/env";
import { getTemplate } from "@/templates/registry";
import { SITES, type SiteKey } from "@/config/markets";
import { JsonLd, breadcrumb } from "@/components/marketing/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ site: string; occasion: string }> }) {
  const { site, occasion } = await params;
  const o = occasionBySlug(occasion);
  if (!o) return {};
  const lang = SITES[site as SiteKey]?.locale ?? "en";
  return siteMetadata(site as SiteKey, `/gifts/${occasion}`, { title: `${o.name[lang]} gifts — interactive digital ${o.name.en.toLowerCase()} gift ideas`, description: `Interactive ${o.name.en.toLowerCase()} gifts with photos, letters and voice notes. Free preview, private link, delivered at midnight.` });
}

export default async function OccasionPage({ params }: { params: Promise<{ site: string; occasion: string }> }) {
  const { site, locale, market, h } = await resolveSite(params);
  const { occasion } = await params;
  const o = occasionBySlug(occasion);
  if (!o || !o.landing || o.release > RELEASE || !o.markets.includes(market)) notFound();
  const t = await getTranslations("occasionPage");
  const tg = await getTranslations("gallery");
  const currency = await siteCurrency(site);
  const name = o.name[locale];
  const date = nextOccurrence(o, now());
  const days = date ? daysUntil(date, now()) : null;
  const items = (await galleryItems(site, currency, (p) => tg("from", { price: p }), tg("free"))).filter((i) => i.occasion.includes(o.slug) || o.featuredTemplates.includes(i.slug));
  const first = o.featuredTemplates.find((s) => getTemplate(s)) ?? "quick-surprise";
  return (
    <main data-glow={o.glow}>
      <JsonLd data={breadcrumb([["Home", h("/")], ["Gifts", h("/gifts")], [name, h(`/gifts/${o.slug}`)]])} />
      <PageHero glow={o.glow} eyebrow={days !== null ? t("countdown", { name, n: days }) + " " + o.emoji : o.emoji} title={t("gifts", { name })} sub={t("sub", { name })}>
        <ButtonLink href={`/create/${first}`} size="lg">{getTemplate(first)!.meta.name[locale]} →</ButtonLink>
      </PageHero>
      <div className="container-x"><GalleryGrid items={items} occasions={[]} showFilters={false} /></div>
    </main>
  );
}
