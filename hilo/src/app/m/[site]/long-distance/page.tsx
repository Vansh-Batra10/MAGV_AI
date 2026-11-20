import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LongDistanceGlobe } from "@/components/marketing/home/Interactive";
import { LiveThumb } from "@/components/marketing/TemplateCard";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/long-distance", { title: "Long distance relationship gifts — midnight delivery in their timezone" });
}

export default async function LongDistance({ params }: { params: Promise<{ site: string }> }) {
  await resolveSite(params);
  const t = await getTranslations("ldPage");
  return (
    <main data-glow="lavender">
      <PageHero glow="lavender" eyebrow={t("eyebrow")} title={t.rich("title", { em: (c) => <em className="text-lavender-300">{c}</em> })} sub={t("sub")}>
        <ButtonLink href="/create/laal-dhaaga" size="lg">{t("cta")}</ButtonLink>
      </PageHero>
      <section className="container-x grid items-center gap-14 md:grid-cols-2">
        <LongDistanceGlobe />
        <div className="flex flex-col gap-4">
          {[["f1", "f1b"], ["f2", "f2b"], ["f3", "f3b"]].map(([a, b], k) => (
            <Reveal key={a} delay={k * 80} className="glass p-6"><h2 className="h3 text-hi">{t(a)}</h2><p className="mt-2 text-mid">{t(b)}</p></Reveal>
          ))}
        </div>
      </section>
      <section className="container-x mt-24 flex justify-center"><LiveThumb slug="laal-dhaaga" className="w-full max-w-[300px]" /></section>
    </main>
  );
}
