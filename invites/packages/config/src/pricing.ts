/** Starting points for A/B tests (§23). Display prices for India are GST-inclusive. TODO_VERIFY(GST invoice rules). */
export type TierId = "preview" | "classic" | "signature" | "couture";

export interface Entitlements {
  canSend: boolean;
  maxGuestLinks: number | null; // null = unlimited
  watermark: boolean;
  rsvp: boolean;
  dashboard: boolean;
  staticCards: boolean;
  qr: boolean;
  shagun: boolean;
  videoVariants: number;
  ashirwadBook: boolean;
  songRequests: boolean;
  liveUpdates: boolean;
  personalAiAssets: boolean;
  removeBrandFooter: boolean;
  prioritySupport: boolean;
  templatesIncluded: "all-preview" | 1;
}

export interface PriceTier {
  id: TierId;
  name: string;
  inr: number; // rupees, GST-inclusive display
  usd: number;
  entitlements: Entitlements;
}

const base: Entitlements = {
  canSend: false, maxGuestLinks: 0, watermark: true, rsvp: false, dashboard: false, staticCards: false, qr: false,
  shagun: false, videoVariants: 0, ashirwadBook: false, songRequests: false, liveUpdates: false,
  personalAiAssets: false, removeBrandFooter: false, prioritySupport: false, templatesIncluded: "all-preview",
};

const classic: Entitlements = { ...base, canSend: true, maxGuestLinks: 250, watermark: false, rsvp: true, dashboard: true, staticCards: true, qr: true, templatesIncluded: 1 };
const signature: Entitlements = { ...classic, maxGuestLinks: null, shagun: true, videoVariants: 2, ashirwadBook: true, songRequests: true, liveUpdates: true };
const couture: Entitlements = { ...signature, personalAiAssets: true, removeBrandFooter: true, prioritySupport: true };

export const tiers: Record<TierId, PriceTier> = {
  preview: { id: "preview", name: "Preview", inr: 0, usd: 0, entitlements: base },
  classic: { id: "classic", name: "Classic", inr: 1499, usd: 29, entitlements: classic },
  signature: { id: "signature", name: "Signature", inr: 2999, usd: 49, entitlements: signature },
  couture: { id: "couture", name: "Couture", inr: 5999, usd: 99, entitlements: couture },
};

export const addOns = {
  extraVideoVariant: { inr: 499, usd: 9 },
  extraFunctionAfterPublish: { inr: 299, usd: 5 },
  illustratorTouchUp: { inr: 2499, usd: 39 },
} as const;

export function entitlementsFor(tier: TierId): Entitlements {
  return tiers[tier].entitlements;
}

/** Can this wedding add one more personal guest link? */
export function canAddGuestLink(tier: TierId, currentLinks: number): boolean {
  const max = tiers[tier].entitlements.maxGuestLinks;
  return max === null || currentLinks < max;
}

/** Refund policy (§23): full refund before the first guest link is sent. */
export function isRefundable(firstSentAt: Date | null): boolean {
  return firstSentAt === null;
}

/** Indian digit grouping: 100000 -> "1,00,000". */
export function formatINR(amount: number, withSymbol = true): string {
  const s = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  return withSymbol ? `₹${s}` : s;
}
