import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { siteCurrency } from "@/lib/server/market";
import { PRICES, formatMoney } from "@/config/pricing";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LiveThumb } from "@/components/marketing/TemplateCard";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/group", { title: "Group gifts — one link, everyone's messages, one surprise" });
}

export default async function GroupPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await resolveSite(params);
  const t = await getTranslations("groupPage");
  const cur = await siteCurrency(site);
  const em = (c: React.ReactNode) => <em className="text-kiss pr-1">{c}</em>;
  return (
    <main data-glow="rose">
      <PageHero eyebrow={t("eyebrow")} title={t.rich("title", { em })} sub={t("sub")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/create/sab-ki-taraf-se" size="lg">{t("cta")}</ButtonLink>
          <p className="text-sm text-mid">{t("price", { price: formatMoney(PRICES[cur].group.forever!, cur), plus: formatMoney(PRICES[cur].group_plus.forever!, cur) })}</p>
        </div>
      </PageHero>
      <section className="container-x grid items-center gap-14 md:grid-cols-[1fr_340px]">
        <ol className="flex flex-col gap-6">
          {[["s1", "s1b"], ["s2", "s2b"], ["s3", "s3b"]].map(([a, b], k) => (
            <Reveal key={a} delay={k * 80} as="li" className="glass flex gap-5 p-6">
              <span className="font-display text-[56px] leading-none text-rose-400">{k + 1}</span>
              <div><h2 className="h3 text-hi">{t(a)}</h2><p className="mt-2 text-mid">{t(b)}</p></div>
            </Reveal>
          ))}
          <p className="mt-4 text-sm leading-relaxed text-lo">{t("uses")}</p>
        </ol>
        <LiveThumb slug="sab-ki-taraf-se" />
      </section>
    </main>
  );
}
