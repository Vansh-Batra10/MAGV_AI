import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { PageHero } from "@/components/marketing/PageHero";
import { BRAND } from "@/config/brand";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/about", { title: `About ${BRAND.name}` });
}

export default async function About({ params }: { params: Promise<{ site: string }> }) {
  await resolveSite(params);
  const t = await getTranslations("about");
  return (
    <main>
      <PageHero title={t("title", { brand: BRAND.name })} />
      <div className="container-x max-w-3xl">
        <div className="flex flex-col gap-6 text-[19px] leading-[1.7] text-mid">
          <p className="font-display text-[30px] leading-snug text-hi">{t("p1")}</p>
          <p>{t("p2", { brand: BRAND.name })}</p>
          <p>{t("p3")}</p>
        </div>
      </div>
    </main>
  );
}
