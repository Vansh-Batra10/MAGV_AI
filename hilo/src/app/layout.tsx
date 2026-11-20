import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { fontVars } from "./fonts";
import { Grain } from "@/components/ui/Grain";
import { BRAND, SITE_URL } from "@/config/brand";
import { HTML_LANG, isLocale } from "@/i18n/locales";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: "Interactive digital gifts for your person, your people and every festival. Photos, letters, voice notes — group gifts built in.",
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B0714",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={isLocale(locale) ? HTML_LANG[locale] : "en"} className={fontVars} suppressHydrationWarning>
      <body>
        {children}
        <Grain />
      </body>
    </html>
  );
}
