import { z } from "zod";

export const Locale = z.enum(["en", "hi", "hinglish"]);
export type Locale = z.infer<typeof Locale>;
export const Tone = z.enum(["formal", "warm", "playful"]);
export type Tone = z.infer<typeof Tone>;
export const CeremonyStyle = z.enum([
  "hindu-north", "hindu-south", "anand-karaj", "nikah", "walima", "church", "jain", "interfaith", "secular",
]);
export type CeremonyStyle = z.infer<typeof CeremonyStyle>;
export const Motif = z.enum(["ganesh", "om", "ik-onkar", "khanda", "bismillah", "cross", "none"]);
export type Motif = z.infer<typeof Motif>;
export const EventKind = z.enum(["haldi", "mehendi", "sangeet", "cocktail", "wedding", "reception", "custom"]);
export type EventKind = z.infer<typeof EventKind>;
export const Side = z.enum(["bride", "groom", "both"]);

const nonEmpty = z.string().trim().min(1);

export const Person = z.object({
  name: nonEmpty.max(80),
  /** Devanagari spelling, optional. */
  nameHi: z.string().trim().max(80).optional(),
  shortName: z.string().trim().max(30).optional(),
});
export type Person = z.infer<typeof Person>;

export const DressCode = z.object({
  /** Display name, e.g. "Peela". */
  name: nonEmpty.max(24),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const WeddingEvent = z.object({
  id: nonEmpty,
  kind: EventKind,
  titleEn: nonEmpty.max(60),
  titleHi: z.string().max(60).optional(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional(),
  tz: z.string().default("Asia/Kolkata"),
  venueName: nonEmpty.max(100),
  venueArea: z.string().max(100).optional(),
  venueAddress: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  mapsUrl: z.string().url().optional(),
  dressCode: z.array(DressCode).max(4).default([]),
  isPublic: z.boolean().default(false),
  liveStreamUrl: z.string().url().optional(),
});
export type WeddingEvent = z.infer<typeof WeddingEvent>;

export const StoryBeat = z.object({
  caption: nonEmpty.max(90),
  photoUrl: z.string().optional(),
});

export const ShagunBlock = z.object({
  id: nonEmpty,
  title: nonEmpty.max(50),
  amount: z.number().int().positive().nullable(), // null = any amount
  emoji: z.string().max(8).optional(),
  story: z.string().max(80).optional(),
});
export const ShagunFund = z.object({
  id: nonEmpty,
  title: nonEmpty.max(50),
  story: z.string().max(120).optional(),
  blocks: z.array(ShagunBlock).min(1).max(12),
});
export const GiftItem = z.object({
  id: nonEmpty,
  title: nonEmpty.max(80),
  url: z.string().url(),
  claimed: z.boolean().default(false),
});

export const Shagun = z.object({
  enabled: z.boolean(),
  /** UPI VPA, e.g. "ananya@okaxis". Only shown after OTP verification of the couple. */
  vpa: z.string().regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/),
  payeeName: nonEmpty.max(60),
  funds: z.array(ShagunFund).max(6).default([]),
  gifts: z.array(GiftItem).max(30).default([]),
  showProgress: z.boolean().default(false),
});
export type Shagun = z.infer<typeof Shagun>;

export const Faq = z.object({ q: nonEmpty.max(120), a: nonEmpty.max(600) });

export const Stay = z.object({
  hotel: nonEmpty.max(100),
  address: z.string().max(300).optional(),
  mapsUrl: z.string().url().optional(),
  note: z.string().max(200).optional(),
});

/** The couple's content, shared by every guest of a wedding. */
export const WeddingContent = z.object({
  inviteId: nonEmpty,
  bride: Person,
  groom: Person,
  /** Who is named first on the card. */
  order: z.enum(["bride-first", "groom-first"]).default("bride-first"),
  families: z.object({
    brideParents: z.string().max(120).optional(),
    groomParents: z.string().max(120).optional(),
    blessingLine: z.string().max(160).optional(),
  }).default({}),
  city: z.string().max(60).optional(),
  ceremonyStyle: CeremonyStyle,
  /** For interfaith weddings, up to two motifs side by side. */
  motifs: z.array(Motif).min(1).max(2),
  defaultLocale: Locale,
  defaultTone: Tone,
  devanagariNumerals: z.boolean().default(false),
  events: z.array(WeddingEvent).min(1).max(12),
  story: z.array(StoryBeat).max(4).default([]),
  shagun: Shagun.optional(),
  faq: z.array(Faq).max(12).default([]),
  stay: Stay.optional(),
  rsvpDeadline: z.string().datetime({ offset: true }).optional(),
  updates: z.array(z.object({ id: nonEmpty, message: nonEmpty.max(160), at: z.string().datetime({ offset: true }) })).default([]),
  hideBrandFooter: z.boolean().default(false),
  watermark: z.boolean().default(false),
});
export type WeddingContent = z.infer<typeof WeddingContent>;

/** Per-guest variables (§10). */
export const GuestVars = z.object({
  guestCode: nonEmpty,
  salutation: nonEmpty.max(60),
  shortName: z.string().max(30).optional(),
  invitedEventIds: z.array(nonEmpty).min(1),
  locale: Locale,
  tone: Tone,
  householdMax: z.number().int().min(1).max(20).default(2),
  shagunVisible: z.boolean().default(false),
  side: Side.default("both"),
  note: z.string().max(140).optional(),
  room: z.string().max(60).optional(),
  outstation: z.boolean().default(false),
  /** ISO time of the guest's previous visit, used for "live update" banners. */
  lastVisitAt: z.string().datetime({ offset: true }).optional(),
  replied: z.boolean().default(false),
});
export type GuestVars = z.infer<typeof GuestVars>;

export const RsvpStatus = z.enum(["yes", "maybe", "no"]);
export const Food = z.enum(["veg", "jain", "vegan", "non-veg"]);
export const RsvpEntry = z.object({
  eventId: nonEmpty,
  status: RsvpStatus,
  adults: z.number().int().min(0).max(20).default(1),
  kids: z.number().int().min(0).max(20).default(0),
});
export const RsvpSubmission = z.object({
  entries: z.array(RsvpEntry).min(1),
  food: Food.optional(),
  allergies: z.string().max(200).optional(),
  arrivalAt: z.string().max(40).optional(),
  arrivalMode: z.enum(["train", "flight", "road", "local"]).optional(),
  refNo: z.string().max(20).optional(),
  pickupNeeded: z.boolean().default(false),
  stayNeeded: z.boolean().default(false),
  message: z.string().max(500).optional(),
  blessing: z.string().max(160).optional(),
  signatureSvg: z.string().max(20000).optional(),
  songRequest: z.string().max(100).optional(),
  team: z.enum(["ladkewale", "ladkiwale"]).optional(),
});
export type RsvpSubmission = z.infer<typeof RsvpSubmission>;

export function invitedEvents(content: WeddingContent, guest: Pick<GuestVars, "invitedEventIds">): WeddingEvent[] {
  const ids = new Set(guest.invitedEventIds);
  return content.events
    .filter((e) => ids.has(e.id))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** Pair the names in the couple's chosen order. */
export function coupleOrder(c: Pick<WeddingContent, "bride" | "groom" | "order">): [Person, Person] {
  return c.order === "groom-first" ? [c.groom, c.bride] : [c.bride, c.groom];
}
