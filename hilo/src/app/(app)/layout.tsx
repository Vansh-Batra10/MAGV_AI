import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

/** App routes (unprefixed): UI language from the visitor's cookie / edition. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
