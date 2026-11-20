import { resolveSite } from "@/lib/server/site";
import { PageHero } from "@/components/marketing/PageHero";
import { Terms } from "@/content/legal";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/terms", { title: "Terms" });
}

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { market } = await resolveSite(params);
  void market;
  return (
    <main>
      <PageHero title="Terms" />
      <article lang="en" className="container-x max-w-3xl text-[17px] leading-[1.75] text-mid [&_b]:text-hi [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <Terms market={market} />
      </article>
    </main>
  );
}
