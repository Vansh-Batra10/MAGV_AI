import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { SITES, isSiteKey } from "@/config/markets";
import { isLocale, type Locale } from "./locales";

export async function loadMessages(locale: Locale) {
  switch (locale) {
    case "hi-Latn":
      return (await import("../../messages/hi-Latn.json")).default;
    case "hi":
      return (await import("../../messages/hi.json")).default;
    default:
      return (await import("../../messages/en.json")).default;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!isLocale(locale)) {
    const site = (await headers()).get("x-hilo-site");
    if (site && isSiteKey(site)) locale = SITES[site].locale;
  }
  if (!isLocale(locale)) {
    const c = await cookies();
    const lang = c.get("hilo_lang")?.value;
    const site = c.get("hilo_site")?.value;
    locale = isLocale(lang) ? lang : site === "in" ? "hi-Latn" : site === "in-hi" ? "hi" : "en";
  }
  const l = locale as Locale;
  return { locale: l, messages: await loadMessages(l), timeZone: "UTC" };
});
