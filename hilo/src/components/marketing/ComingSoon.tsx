import { getTranslations } from "next-intl/server";
import { PageHero } from "./PageHero";
import { ButtonLink } from "@/components/ui/Button";

/** Honest, polished "coming soon" state for features scheduled for a later release. */
export async function ComingSoon({ title, body, href }: { title?: string; body: string; href: string }) {
  const t = await getTranslations("comingSoon");
  return (
    <main>
      <PageHero eyebrow={t("title")} title={title ?? t("title")} sub={body}>
        <ButtonLink href={href} variant="glass">{t("back")}</ButtonLink>
      </PageHero>
    </main>
  );
}
