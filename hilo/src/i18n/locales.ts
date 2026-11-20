export const LOCALES = ["en", "hi-Latn", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
/** HTML lang attribute per locale. Hinglish is Latin-script Hindi → tagged as en-IN for hreflang (see DECISIONS.md). */
export const HTML_LANG: Record<Locale, string> = { en: "en", "hi-Latn": "hi-Latn", hi: "hi" };
