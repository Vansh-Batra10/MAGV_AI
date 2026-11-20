import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTemplate } from "@/templates/registry";
import { requireAdmin } from "@/lib/server/admin";
import { loadMessages } from "@/i18n/request";
import { ReelStage } from "@/components/studio/ReelStage";
import { isLocale } from "@/i18n/locales";

export const metadata = { robots: { index: false } };

export default async function ReelStudio({ params, searchParams }: { params: Promise<{ templateSlug: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireAdmin({ devOpen: true });
  const { templateSlug } = await params;
  const sp = await searchParams;
  const tpl = getTemplate(templateSlug);
  if (!tpl) notFound();
  const lang = isLocale(sp.lang) ? sp.lang : "en";
  const all = await loadMessages(lang);
  const content = { ...tpl.defaults(lang), ...(sp.name ? { recipientName: sp.name } : {}) };
  return (
    <NextIntlClientProvider locale={lang} messages={{ gift: all.gift, media: all.media }}>
      <ReelStage template={templateSlug} content={content} lang={lang} speed={Number(sp.speed ?? 1)} mode={(sp.mode as "reel" | "preview" | "live" | "thumbnail") ?? "reel"} autostart={sp.autostart === "1"} />
    </NextIntlClientProvider>
  );
}
