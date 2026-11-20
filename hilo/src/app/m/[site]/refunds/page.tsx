import { resolveSite } from "@/lib/server/site";
import { PageHero } from "@/components/marketing/PageHero";
import { Refunds } from "@/content/legal";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/refunds", { title: "Refunds" });
}

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { market } = await resolveSite(params);
  void market;
  return (
    <main>
      <PageHero title="Refunds" />
      <article lang="en" className="container-x max-w-3xl text-[17px] leading-[1.75] text-mid [&_b]:text-hi [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <Refunds market={market} />
      </article>
    </main>
  );
}
