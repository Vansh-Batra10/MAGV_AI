import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { resolveSite } from "@/lib/server/site";
import { q } from "@/lib/server/db";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/reviews", { title: "Reviews — only from real buyers" });
}

export default async function Reviews({ params }: { params: Promise<{ site: string }> }) {
  const { h } = await resolveSite(params);
  const t = await getTranslations("reviewsPage");
  const reviews = await q<{ id: string; name: string; city: string | null; rating: number; text: string }>(`select id, name, city, rating, text from reviews where approved=true order by created_at desc limit 60`);
  return (
    <main>
      <PageHero title={t("title")} sub={t("sub")} />
      <div className="container-x">
        {reviews.length === 0 ? (
          <div className="glass mx-auto max-w-xl p-10 text-center">
            <p className="text-lg text-mid">{t("empty")}</p>
            <ButtonLink href={h("/gifts")} className="mt-6">→</ButtonLink>
          </div>
        ) : (
          <div className="columns-1 gap-5 md:columns-3">
            {reviews.map((r) => (
              <figure key={r.id} className="glass mb-5 break-inside-avoid p-6">
                <div className="flex gap-0.5 text-amber-300" aria-label={`${r.rating} / 5`}>{Array.from({ length: r.rating }, (_, k) => <Star key={k} size={14} fill="currentColor" />)}</div>
                <blockquote className="mt-3 leading-relaxed text-hi">{r.text}</blockquote>
                <figcaption className="mt-3 text-sm text-lo">— {r.name}{r.city ? `, ${r.city}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
