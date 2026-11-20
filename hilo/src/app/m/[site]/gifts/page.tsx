import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { siteCurrency, galleryItems, filterOccasions } from "@/lib/server/market";
import { PageHero } from "@/components/marketing/PageHero";
import { GalleryGrid } from "@/components/marketing/GalleryGrid";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  return siteMetadata(site as SiteKey, "/gifts", { title: "All gifts — interactive digital gifts" });
}

export default async function Gifts({ params }: { params: Promise<{ site: string }> }) {
  const { site, locale } = await resolveSite(params);
  const t = await getTranslations("gallery");
  const currency = await siteCurrency(site);
  return (
    <main>
      <PageHero title={t("title")} sub={t("sub")} />
      <div className="container-x">
        <GalleryGrid items={await galleryItems(site, currency, (p) => t("from", { price: p }), t("free"))} occasions={filterOccasions(site, locale)} />
        <div className="glass mx-auto mt-20 max-w-2xl p-8 text-center">
          <p className="font-display text-[30px] text-hi">{t("comingSoon")}</p>
          <p className="mt-2 text-mid">{t("comingSoonSub")}</p>
        </div>
      </div>
    </main>
  );
}
