import type { Currency, Market } from "./markets";

/** All prices are starting points for A/B tests. Minor units (paise / cents). GST-inclusive for INR. */
export type Tier = "free" | "mini" | "classic" | "premium" | "group" | "group_plus";
export type Duration = "h24" | "forever";

type PriceTable = Record<Exclude<Tier, "free">, Partial<Record<Duration, number>>>;

export const PRICES: Record<Currency, PriceTable> = {
  INR: {
    mini: { h24: 4900, forever: 9900 },
    classic: { h24: 9900, forever: 19900 },
    premium: { forever: 34900 },
    group: { forever: 49900 },
    group_plus: { forever: 79900 },
  },
  USD: {
    mini: { h24: 199, forever: 399 },
    classic: { h24: 399, forever: 699 },
    premium: { forever: 1199 },
    group: { forever: 1499 },
    group_plus: { forever: 2499 },
  },
};

export const GROUP_LIMITS = { group: 25, group_plus: 100 } as const;

export const ADDONS = {
  extraPhotos: { INR: 4900, USD: 199, extraSlots: 10 },
  customMusic: { INR: 2900, USD: 99 },
  password: { INR: 0, USD: 0 },
} as const;
export type AddonKey = keyof typeof ADDONS;

export const SEASON_PASS = { enabled: false, days: 30, INR: 49900, USD: 1499 } as const;

export const FREE_TIER = {
  hours: 24,
  maxPerContactPer30Days: 3,
  photosMax: 1,
  messageMax: 280,
} as const;

export const REFERRAL = { refereeOffMinor: { INR: 3000, USD: 50 }, referrerCreditMinor: { INR: 3000, USD: 50 } } as const;
export const REACTION_INCENTIVE_MINOR = { INR: 5000, USD: 100 } as const;
export const PARTNER_DEFAULT_COMMISSION_PCT = 25;

/** Paid gifts never expire unless the owner deletes them. Flag kept for a future policy change. */
export const PAID_GIFTS_EXPIRE = false;

/**
 * Price experiments. Each experiment maps a bucket to overrides.
 * The visitor's bucket is stored in the `hilo_ab` cookie and logged on the order.
 */
export const EXPERIMENTS: Record<string, { active: boolean; buckets: Record<string, Partial<Record<Currency, Partial<PriceTable>>>> }> = {
  classic_forever_inr: {
    active: false,
    buckets: { A: {}, B: { INR: { classic: { h24: 9900, forever: 14900 } } } },
  },
};

export function priceFor(currency: Currency, tier: Tier, duration: Duration, bucket?: string | null): number | null {
  if (tier === "free") return 0;
  for (const exp of Object.values(EXPERIMENTS)) {
    if (!exp.active || !bucket) continue;
    const o = exp.buckets[bucket]?.[currency]?.[tier]?.[duration];
    if (typeof o === "number") return o;
  }
  return PRICES[currency][tier][duration] ?? null;
}

export function durationsFor(tier: Tier): Duration[] {
  if (tier === "free") return ["h24"];
  return (Object.keys(PRICES.INR[tier]) as Duration[]).sort((a) => (a === "h24" ? -1 : 1));
}

/** Upgrade 24h → Forever: pay the difference. */
export function upgradePrice(currency: Currency, tier: Tier, bucket?: string | null): number {
  if (tier === "free") return PRICES[currency].mini.forever!;
  const f = priceFor(currency, tier, "forever", bucket) ?? 0;
  const d = priceFor(currency, tier, "h24", bucket) ?? 0;
  return Math.max(0, f - d);
}

export function formatMoney(minor: number, currency: Currency): string {
  const major = minor / 100;
  if (currency === "INR") {
    return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: major % 1 ? 2 : 0 }).format(major);
  }
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(major);
}

export function currencyForMarket(m: Market): Currency {
  return m === "IN" ? "INR" : "USD";
}

/** Unit economics knobs (admin dashboard). */
export const ECONOMICS = {
  gstRate: 0.18,
  gatewayDomesticPct: 0.02,
  gatewayInternationalPct: 0.03,
  gstOnFee: 0.18,
  messagingCostMinor: { whatsapp_utility: 13, whatsapp_marketing: 88, sms: 80, email: 1 },
  usdToInr: 84,
} as const;
