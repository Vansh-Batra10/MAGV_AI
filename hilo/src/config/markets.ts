export type Market = "IN" | "GLOBAL";
export type UiLocale = "en" | "hi-Latn" | "hi";
export type GiftLanguage = UiLocale;
export type Currency = "INR" | "USD";

/** A "site" is one prefixed edition+language combination for marketing routes. */
export type SiteKey = "global" | "in" | "in-en" | "in-hi";

export const SITES: Record<SiteKey, { market: Market; locale: UiLocale; prefix: string; hreflang: string; label: string }> = {
  global: { market: "GLOBAL", locale: "en", prefix: "", hreflang: "en", label: "🌍 Global · English" },
  in: { market: "IN", locale: "hi-Latn", prefix: "/in", hreflang: "en-IN", label: "🇮🇳 India · Hinglish" },
  "in-en": { market: "IN", locale: "en", prefix: "/in/en", hreflang: "en-IN", label: "🇮🇳 India · English" },
  "in-hi": { market: "IN", locale: "hi", prefix: "/in/hi", hreflang: "hi-IN", label: "🇮🇳 भारत · हिंदी" },
};

export const SITE_KEYS = Object.keys(SITES) as SiteKey[];

export function isSiteKey(v: string): v is SiteKey {
  return v in SITES;
}

export const MARKETS = {
  IN: {
    currency: "INR" as Currency,
    defaultLocale: "hi-Latn" as UiLocale,
    locales: ["hi-Latn", "en", "hi"] as UiLocale[],
    deliveryChannels: ["whatsapp", "email"] as const,
    shareOrder: ["whatsapp", "copy", "instagram", "sms", "email"] as const,
    paymentMethods: ["upi", "card", "netbanking", "wallet"] as const,
    distanceUnit: "km" as const,
    dateFormat: "dd/MM/yyyy",
    hour12: true,
    numberLocale: "en-IN",
  },
  GLOBAL: {
    currency: "USD" as Currency,
    defaultLocale: "en" as UiLocale,
    locales: ["en"] as UiLocale[],
    deliveryChannels: ["sms", "email"] as const,
    shareOrder: ["sms", "copy", "whatsapp", "instagram", "email"] as const,
    paymentMethods: ["card", "applepay"] as const,
    distanceUnit: "km" as const, // miles for US visitors, computed by country
    dateFormat: "MMM d, yyyy",
    hour12: true,
    numberLocale: "en-US",
  },
} as const;

export const GIFT_LANGUAGES: { code: GiftLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi-Latn", label: "Hinglish" },
  { code: "hi", label: "हिंदी" },
];

export function distanceUnitForCountry(country?: string | null): "km" | "mi" {
  return country && ["US", "LR", "MM", "GB"].includes(country) ? "mi" : "km";
}

export function sitePath(site: SiteKey, path = "/"): string {
  const p = path === "/" ? "" : path;
  const prefix = SITES[site].prefix;
  return prefix + p || "/";
}
