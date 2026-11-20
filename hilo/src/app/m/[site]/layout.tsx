import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { isSiteKey, SITES } from "@/config/markets";
import { loadMessages } from "@/i18n/request";
import { SiteProvider } from "@/components/marketing/SiteContext";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ConsentBanner } from "@/components/marketing/Consent";
import { CursorThread } from "@/components/ui/CursorThread";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSiteKey(site)) notFound();
  const locale = SITES[site].locale;
  setRequestLocale(locale);
  const messages = await loadMessages(locale);
  const path = (await headers()).get("x-hilo-path") ?? "/";
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteProvider site={site}>
        <SmoothScroll />
        <CursorThread />
        <Nav />
        <div lang={locale === "hi" ? "hi" : locale === "hi-Latn" ? "hi-Latn" : "en"}>{children}</div>
        <Footer site={site} path={path} />
        <ConsentBanner />
      </SiteProvider>
    </NextIntlClientProvider>
  );
}
