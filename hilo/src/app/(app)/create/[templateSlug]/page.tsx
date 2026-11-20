import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getTemplate } from "@/templates/registry";
import { loadMessages } from "@/i18n/request";
import { Creator } from "@/components/creator/Creator";
import { isLocale } from "@/i18n/locales";
import type { GiftLanguage } from "@/config/markets";
import { pick } from "@/templates/types";

export async function generateMetadata({ params }: { params: Promise<{ templateSlug: string }> }) {
  const tpl = getTemplate((await params).templateSlug);
  return { title: tpl ? `Make: ${tpl.meta.name.en}` : "Create", robots: { index: false } };
}

export default async function CreatePage({ params, searchParams }: { params: Promise<{ templateSlug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { templateSlug } = await params;
  const sp = await searchParams;
  const tpl = getTemplate(templateSlug);
  if (!tpl) notFound();
  const ui = await getLocale();
  const lang: GiftLanguage = isLocale(sp.lang) ? sp.lang : isLocale(ui) ? ui : "en";
  const [en, hl, hi] = await Promise.all([loadMessages("en"), loadMessages("hi-Latn"), loadMessages("hi")]);
  const giftMessages = { en: { gift: en.gift, media: en.media }, "hi-Latn": { gift: hl.gift, media: hl.media }, hi: { gift: hi.gift, media: hi.media } };
  return (
    <>
      <h2 className="sr-only">{pick(tpl.meta.name, lang)}</h2>
      <Creator slug={templateSlug} initialLang={lang} giftMessages={giftMessages} initialName={sp.name?.slice(0, 40)} initialSender={sp.sender?.slice(0, 40)} startInForm={sp.mode === "form"} resumeId={sp.gift} />
    </>
  );
}
