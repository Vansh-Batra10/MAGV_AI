import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Lock, Trash2, MessageCircle, Receipt, Link2, Mail } from "lucide-react";
import { isSiteKey, SITES, type SiteKey } from "@/config/markets";
import { activeTakeover, upcomingOccasions, RELEASE } from "@/config/occasions";
import { getTemplate } from "@/templates/registry";
import { PRICES } from "@/config/pricing";
import { BRAND } from "@/config/brand";
import { now } from "@/lib/server/env";
import { siteCurrency, galleryItems, filterOccasions } from "@/lib/server/market";
import { Starfield } from "@/components/ui/Starfield";
import { ThreadArc, ThreadDivider } from "@/components/ui/Thread";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { HeroDemo } from "@/components/marketing/HeroDemo";
import { Section, SectionHead } from "@/components/marketing/Section";
import { GalleryGrid } from "@/components/marketing/GalleryGrid";
import { OccasionStrip, TryIt, LongDistanceGlobe, HowItWorks, PricingToggle, Faq, ModesVisual } from "@/components/marketing/home/Interactive";
import { siteMetadata } from "@/lib/seo";
import { trackServer } from "@/lib/server/trackServer";
import { JsonLd, organization, faqPage } from "@/components/marketing/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  return siteMetadata(site as SiteKey, "/", { title: `${BRAND.name} — ${BRAND.tagline}` });
}

const em = (c: React.ReactNode) => <em className="text-kiss pr-1">{c}</em>;

export default async function Home({ params, searchParams }: { params: Promise<{ site: string }>; searchParams: Promise<{ season?: string }> }) {
  const { site } = await params;
  if (!isSiteKey(site)) return null;
  const { locale, market, prefix } = SITES[site];
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("home");
  const tg = await getTranslations("gallery");
  const tp = await getTranslations("pricingPage");
  const h = (p: string) => (prefix + (p === "/" ? "" : p)) || "/";
  const today = now();
  const country = (await cookies()).get("hilo_country")?.value ?? null;
  const takeover = activeTakeover(market, today, country, sp.season);
  const glow = takeover?.occasion.glow ?? "rose";
  const heroSlugs = (takeover?.occasion.featuredTemplates ?? ["sab-ki-taraf-se", "laal-dhaaga", "midnight-birthday"]).filter((s) => getTemplate(s)).slice(0, 3);
  const eyebrow = takeover?.occasion.heroCopy && takeover.days !== null
    ? (country && country !== "IN" && takeover.occasion.regions.includes("diaspora") && market === "GLOBAL" ? t("fromAbroad", { name: takeover.occasion.name.en }) : takeover.occasion.heroCopy[locale].replace("{days}", String(takeover.days))) + " " + takeover.occasion.emoji
    : t("eyebrow");
  const upcoming = upcomingOccasions(market, today, country).filter((u) => u.occasion.release <= RELEASE + 2);
  const strip = [...(takeover ? [takeover] : []), ...upcoming.filter((u) => u.occasion.slug !== takeover?.occasion.slug)].slice(0, 10).map((u) => ({
    slug: u.occasion.slug, name: u.occasion.name[locale], emoji: u.occasion.emoji, glow: u.occasion.glow, art: u.occasion.art, days: u.days, landing: u.occasion.landing && u.occasion.release <= RELEASE,
  }));
  const currency = await siteCurrency(site);
  const items = await galleryItems(site, currency, (p) => tg("from", { price: p }), tg("free"));
  const india = market === "IN";
  const trust = india ? [t("trustRow.noApp"), t("trustRow.preview"), t("trustRow.upi"), t("trustRow.india")] : [t("trustRow.noApp"), t("trustRow.preview"), t("trustRow.private"), t("trustRow.secure")];
  const faq = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));
  const P = PRICES[currency];
  await trackServer("landing_view", { site, season: takeover?.occasion.slug ?? null });

  return (
    <main data-glow={glow}>
      <JsonLd data={organization} />
      <JsonLd data={faqPage(faq)} />
      {/* 2. Hero */}
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden pb-16 pt-28 md:pt-24">
        <div className="absolute inset-0 [background:var(--grad-aurora)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 75% 45%, rgba(var(--glow-rgb),0.16), transparent 70%)" }} />
        <Starfield density={1.2} />
        <ThreadArc color="var(--glow)" />
        <div className="container-x relative grid items-center gap-14 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="anim-lift inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[13px] font-medium text-hi backdrop-blur" data-testid="hero-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--glow)] shadow-[0_0_8px_var(--glow)]" /> {eyebrow}
            </p>
            <h1 className="h1 anim-lift mt-6 text-hi" style={{ animationDelay: "80ms" }}>{t.rich("h1", { em })}</h1>
            <p className="body-lg anim-lift mt-6 max-w-xl text-mid" style={{ animationDelay: "160ms" }}>{t("sub")}</p>
            <div className="anim-lift mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
              <ButtonLink href={h("/gifts")} size="lg">{t("ctaPrimary")}</ButtonLink>
              <ButtonLink href={h("/group")} size="lg" variant="glass">{t("ctaGroup")}</ButtonLink>
            </div>
            <ul className="anim-lift mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-mid" style={{ animationDelay: "320ms" }}>
              {trust.map((x) => <li key={x} className="flex items-center gap-1.5"><Check size={14} className="text-[var(--glow)]" /> {x}</li>)}
            </ul>
          </div>
          <HeroDemo slugs={heroSlugs} label={t("liveDemo")} />
        </div>
      </section>

      {/* 3. Next occasion strip */}
      <Section className="!py-10">
        <div className="container-x">
          <p className="eyebrow mb-5">{t("next.title")}</p>
          <OccasionStrip items={strip} />
        </div>
      </Section>

      {/* 4. Try it */}
      <Section><div className="container-x"><TryIt /></div></Section>

      {/* 5. Individual vs group */}
      <Section>
        <div className="container-x">
          <SectionHead title={t("modes.title")} />
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal className="glass p-8" data-glow="rose">
              <ModesVisual kind="solo" />
              <h3 className="h3 mt-4 text-hi">{t("modes.soloTitle")}</h3>
              <p className="mt-2 text-mid">{t("modes.soloBody")}</p>
              <ButtonLink href={h("/gifts")} variant="glass" className="mt-6">{t("modes.soloCta")}</ButtonLink>
            </Reveal>
            <Reveal className="glass glow-box p-8" delay={80}>
              <ModesVisual kind="group" />
              <h3 className="h3 mt-4 text-hi">{t("modes.groupTitle")}</h3>
              <p className="mt-2 text-mid">{t("modes.groupBody")}</p>
              <ButtonLink href="/create/sab-ki-taraf-se" className="mt-6">{t("modes.groupCta")}</ButtonLink>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 6. Gallery preview */}
      <Section>
        <div className="container-x">
          <SectionHead title={t("gallery.title")} sub={t("gallery.sub")} />
          <GalleryGrid items={items} occasions={filterOccasions(site, locale)} limit={6} showFilters={false} />
          <div className="mt-14 text-center"><ButtonLink href={h("/gifts")} variant="glass">{t("gallery.seeAll")}</ButtonLink></div>
        </div>
      </Section>

      {/* 7. Long distance */}
      <Section glow="lavender" className="overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 70% 50%, rgba(201,182,255,0.12), transparent 70%)" }} />
        <div className="container-x relative grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="h2 text-hi">{t.rich("ld.title", { em: (c) => <em className="text-lavender-300">{c}</em> })}</h2>
            <p className="body-lg mt-4 max-w-md text-mid">{t("ld.sub")}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {[t("ld.b1"), t("ld.b2"), t("ld.b3")].map((b) => <li key={b} className="flex items-center gap-3 text-hi"><span className="grid h-7 w-7 place-items-center rounded-full bg-lavender-300/15 text-lavender-300"><Check size={14} /></span>{b}</li>)}
            </ul>
            <ButtonLink href={h("/long-distance")} variant="glass" className="mt-8">{t("ld.cta")}</ButtonLink>
          </Reveal>
          <LongDistanceGlobe />
        </div>
      </Section>

      {/* 8. How it works */}
      <section aria-label={t("how.title")}>
        <div className="container-x pt-20"><SectionHead title={t("how.title")} /></div>
        <HowItWorks demoSlug="midnight-birthday" steps={[{ t: t("how.s1t"), b: t("how.s1b") }, { t: t("how.s2t"), b: t("how.s2b") }, { t: t("how.s3t"), b: t("how.s3b") }]} />
      </section>

      {/* 9. Reactions wall (honest placeholders) */}
      <Section>
        <div className="container-x">
          <SectionHead title={t("reactions.title")} sub={t("reactions.sub")} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((k) => (
              <Reveal key={k} delay={k * 60} className="glass relative flex aspect-[9/16] flex-col items-center justify-center overflow-hidden p-5 text-center">
                <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(70% 50% at 50% ${30 + k * 10}%, ${["rgba(255,77,126,.3)", "rgba(255,200,112,.25)", "rgba(201,182,255,.3)", "rgba(255,138,101,.25)"][k]}, transparent 70%)` }} />
                <span className="relative text-4xl">{["🥹", "😭", "🫶", "🤭"][k]}</span>
                <p className="relative mt-4 text-sm leading-snug text-mid">{t("reactions.placeholder", { handle: BRAND.instagramHandle })}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* 10. Reminders teaser */}
      <Section glow="amber">
        <div className="container-x grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="h2 text-hi">{t("reminders.title")}</h2>
            <p className="body-lg mt-4 max-w-md text-mid">{t("reminders.sub")}</p>
            <ButtonLink href="/dashboard/reminders" variant="glass" className="mt-8">{t("reminders.cta")}</ButtonLink>
          </Reveal>
          <Reveal delay={100} className="relative mx-auto w-full max-w-sm">
            <div className="glass p-5">
              {[[t("reminders.d1"), "14 Mar", "🎂"], [t("reminders.d2"), "02 Jun", "💍"], [t("reminders.d3"), "21 Sep", "🎉"]].map(([l, d, e]) => (
                <div key={l} className="flex items-center gap-4 border-b border-white/6 py-4 last:border-0">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300/10 text-xl">{e}</span>
                  <span className="flex-1 font-semibold text-hi">{l}</span>
                  <span className="font-mono text-sm text-amber-300">{d}</span>
                </div>
              ))}
            </div>
            <div className="anim-floaty absolute -bottom-10 -right-2 max-w-[260px] rounded-2xl rounded-br-sm bg-[#1f6b4f] p-3 text-[13px] leading-snug text-white shadow-2xl md:-right-10">
              {t("reminders.bubble")}
              <span className="mt-1 block text-right text-[10px] text-white/60">09:00 ✓✓</span>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 11. Pricing preview */}
      <Section>
        <div className="container-x">
          <SectionHead title={t("pricing.title")} sub={t("pricing.sub")} />
          <PricingToggle currency={currency} labels={{ h24: tp("h24"), forever: tp("forever"), free: tp("freeName"), perGift: tp("perGift") }} rows={[
            { key: "free", name: tp("freeName"), desc: tp("freeDesc"), free: true },
            { key: "classic", name: tp("classicName"), desc: tp("classicDesc"), h24: P.classic.h24, forever: P.classic.forever, highlight: true },
            { key: "premium", name: tp("premiumName"), desc: tp("premiumDesc"), forever: P.premium.forever },
            { key: "group", name: tp("groupName"), desc: tp("groupDesc"), forever: P.group.forever },
          ]} />
          <div className="mt-10 text-center"><ButtonLink href={h("/pricing")} variant="ghost">{t("pricing.seeAll")}</ButtonLink></div>
        </div>
      </Section>

      {/* 12. Trust & FAQ */}
      <Section>
        <div className="container-x">
          <SectionHead title={t("trust.title")} />
          <div className="mb-20 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[[Link2, t("trust.t1")], [Lock, t("trust.t2")], [Trash2, t("trust.t3")], [india ? MessageCircle : Mail, india ? t("trust.t4") : t("trust.t4g")], [Receipt, t("trust.t5")]].map(([Icon, label], k) => {
              const I = Icon as typeof Lock;
              return <Reveal key={k} delay={k * 50} className="glass flex flex-col items-start gap-3 p-5"><I size={20} className="text-[var(--glow)]" /><p className="text-[15px] font-medium leading-snug text-hi">{label as string}</p></Reveal>;
            })}
          </div>
          <SectionHead title={t("faq.title")} />
          <Faq items={faq} />
        </div>
      </Section>

      {/* 13. Final CTA */}
      <section className="group relative overflow-hidden py-32 md:py-44">
        <Starfield density={1.6} className="transition-opacity duration-700 group-hover:opacity-100" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(var(--glow-rgb),0.18), transparent 70%)" }} />
        <div className="container-x relative text-center">
          <ThreadDivider className="mx-auto mb-10 max-w-md" />
          <h2 className="h1 mx-auto max-w-4xl text-hi">{t.rich("final.title", { em })}</h2>
          <ButtonLink href={h("/gifts")} size="lg" className="mt-10">{t("final.cta")}</ButtonLink>
        </div>
      </section>
    </main>
  );
}
