import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check, Clock, Image as ImageIcon, Mic, Music } from "lucide-react";
import { resolveSite } from "@/lib/server/site";
import { siteCurrency, fromPrice, galleryItems } from "@/lib/server/market";
import { getTemplate } from "@/templates/registry";
import { displayName, pick } from "@/templates/types";
import { formatMoney, PRICES } from "@/config/pricing";
import { type SiteKey, SITES } from "@/config/markets";
import { ButtonLink } from "@/components/ui/Button";
import { Starfield } from "@/components/ui/Starfield";
import { TemplatePlayer } from "@/components/marketing/TemplatePlayer";
import { GalleryGrid } from "@/components/marketing/GalleryGrid";
import { JsonLd, breadcrumb } from "@/components/marketing/JsonLd";
import { siteMetadata } from "@/lib/seo";
import { SITE_URL } from "@/config/brand";
import { trackServer } from "@/lib/server/trackServer";

export async function generateMetadata({ params }: { params: Promise<{ site: string; templateSlug: string }> }) {
  const { site, templateSlug } = await params;
  const tpl = getTemplate(templateSlug);
  if (!tpl) return {};
  const s = SITES[site as SiteKey];
  return siteMetadata(site as SiteKey, `/t/${templateSlug}`, { title: `${displayName(tpl.meta, s.locale, s.market)} — interactive gift`, description: pick(tpl.meta.tagline, s.locale) });
}

export default async function TemplatePage({ params }: { params: Promise<{ site: string; templateSlug: string }> }) {
  const { site, locale, market, h } = await resolveSite(params);
  const { templateSlug } = await params;
  const tpl = getTemplate(templateSlug);
  if (!tpl || tpl.meta.release > 1) notFound();
  await trackServer("template_view", { template: templateSlug });
  const t = await getTranslations("template");
  const tg = await getTranslations("gallery");
  const currency = await siteCurrency(site);
  const m = tpl.meta;
  const name = displayName(m, locale, market);
  const price = fromPrice(m.tier, currency);
  const prices = m.tier === "free" ? null : PRICES[currency][m.tier];
  const others = (await galleryItems(site, currency, (p) => tg("from", { price: p }), tg("free"))).filter((i) => i.slug !== m.slug).slice(0, 3);
  const product = {
    "@context": "https://schema.org", "@type": "Product", name, description: pick(m.tagline, locale), image: `${SITE_URL}${m.demoPoster}`, brand: { "@type": "Brand", name: "Hilo" },
    offers: Object.entries(prices ?? { h24: 0 }).map(([d, v]) => ({ "@type": "Offer", price: ((v as number) / 100).toFixed(2), priceCurrency: currency, availability: "https://schema.org/InStock", name: d })),
  };
  return (
    <main data-glow={m.glow}>
      <JsonLd data={product} />
      <JsonLd data={breadcrumb([["Home", h("/")], ["Gifts", h("/gifts")], [name, h(`/t/${m.slug}`)]])} />
      <section className="relative overflow-hidden pb-20 pt-32 md:pt-40">
        <div className="absolute inset-0 [background:var(--grad-aurora)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(50% 50% at 70% 40%, rgba(var(--glow-rgb),0.18), transparent 70%)" }} />
        <Starfield density={0.9} />
        <div className="container-x relative grid items-start gap-12 md:grid-cols-[1fr_380px]">
          <div className="md:pt-10">
            <p className="eyebrow mb-4">{m.occasion.slice(0, 3).join(" · ")}</p>
            <h1 className="h1 text-hi">{name}</h1>
            <p className="body-lg mt-5 max-w-xl text-mid">{pick(m.tagline, locale)}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href={`/create/${m.slug}`} size="lg" data-testid="make-this">{m.mode === "group" ? t("makeGroup") : t("make")}</ButtonLink>
              <p className="text-lg font-semibold text-hi">{m.tier === "free" ? tg("free") : price !== null ? tg("from", { price: formatMoney(price, currency) }) : ""}</p>
            </div>
            <p className="mt-3 text-sm text-lo">{t("preview")} · <a className="underline" href={`/create/${m.slug}?mode=form`}>{t("formMode")}</a></p>
            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
              <Fact icon={<Clock size={16} />} label={t("minutes", { n: m.estMinutes })} />
              <Fact icon={<ImageIcon size={16} />} label={t("photos", { n: m.photosMax })} />
              {m.supportsVoice && <Fact icon={<Mic size={16} />} label={t("voice")} />}
              {m.supportsMusic && <Fact icon={<Music size={16} />} label={t("music")} />}
            </div>
            <h2 className="mt-12 font-display text-[30px] text-hi">{t("inside")}</h2>
            <ul className="mt-4 flex max-w-xl flex-col gap-3">
              {m.inside.map((x, k) => <li key={k} className="flex items-start gap-3 text-mid"><Check size={18} className="mt-0.5 shrink-0 text-[var(--glow)]" /> {pick(x, locale)}</li>)}
            </ul>
          </div>
          <div>
            <TemplatePlayer slug={m.slug} />
            <p className="mt-4 text-center text-xs text-lo">{t("tryLive")}</p>
          </div>
        </div>
      </section>
      <section className="container-x">
        <h2 className="h3 mb-10 text-hi">{t("others")}</h2>
        <GalleryGrid items={others} occasions={[]} showFilters={false} />
      </section>
    </main>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="glass flex items-center gap-3 px-4 py-3 text-sm text-hi"><span className="text-[var(--glow)]">{icon}</span>{label}</div>;
}
