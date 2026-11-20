import type { Market } from "./markets";

export type Glow = "rose" | "amber" | "lavender";
export type Audience = "couple" | "family" | "friends" | "everyone";
export type Region = "IN" | "diaspora" | "global";

/**
 * dateRule:
 *  - { kind: "fixed", md: "12-25" }
 *  - { kind: "nthWeekday", month, weekday (0=Sun), n }   (n = -1 → last)
 *  - { kind: "explicit", dates: { 2026: "2026-11-08" }, verify?: number[] }  — lunar/variable festivals
 *  - { kind: "anytime" }
 *  - { kind: "byCountry", default: DateRule, overrides: { GB: DateRule } }
 *  - { kind: "easterOffset", days }
 *
 * TODO_VERIFY_DATE: any year listed in `verify` was entered from memory and must be checked against an
 * official panchang / moon-sighting calendar before launch. See DECISIONS.md.
 */
export type DateRule =
  | { kind: "fixed"; md: string }
  | { kind: "nthWeekday"; month: number; weekday: number; n: number }
  | { kind: "explicit"; dates: Record<number, string>; verify?: number[] }
  | { kind: "anytime" }
  | { kind: "easterOffset"; days: number }
  | { kind: "byCountry"; default: DateRule; overrides: Record<string, DateRule> };

export type Occasion = {
  slug: string;
  name: { en: string; "hi-Latn": string; hi: string };
  audience: Audience;
  regions: Region[];
  markets: Market[];
  dateRule: DateRule;
  takeoverDaysBefore: number;
  priority: number;
  glow: Glow;
  emoji: string;
  art: string;
  heroCopy?: { en: string; "hi-Latn": string; hi: string };
  featuredTemplates: string[];
  /** Has a dedicated /gifts/[occasion] landing page. */
  landing: boolean;
  release: 1 | 2 | 3;
};

const BOTH: Market[] = ["IN", "GLOBAL"];

export const OCCASIONS: Occasion[] = [
  {
    slug: "christmas", name: { en: "Christmas", "hi-Latn": "Christmas", hi: "क्रिसमस" },
    audience: "everyone", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "fixed", md: "12-25" }, takeoverDaysBefore: 40, priority: 10, glow: "amber", emoji: "🎄", art: "snowglobe",
    heroCopy: { en: "Christmas is in {days} days", "hi-Latn": "Christmas sirf {days} din door", hi: "क्रिसमस {days} दिन दूर" },
    featuredTemplates: ["snow-globe", "sab-ki-taraf-se", "laal-dhaaga"], landing: true, release: 1,
  },
  {
    slug: "new-year", name: { en: "New Year", "hi-Latn": "New Year", hi: "नया साल" },
    audience: "everyone", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "fixed", md: "01-01" }, takeoverDaysBefore: 6, priority: 9, glow: "amber", emoji: "🎆", art: "fireworks",
    heroCopy: { en: "New Year in {days} days", "hi-Latn": "Naya saal {days} din mein", hi: "नया साल {days} दिन में" },
    featuredTemplates: ["our-year-rewound", "sab-ki-taraf-se", "laal-dhaaga"], landing: true, release: 1,
  },
  {
    slug: "birthday", name: { en: "Birthday", "hi-Latn": "Birthday", hi: "जन्मदिन" },
    audience: "everyone", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "amber", emoji: "🎂", art: "cake",
    featuredTemplates: ["midnight-birthday", "sab-ki-taraf-se", "quick-surprise"], landing: true, release: 1,
  },
  {
    slug: "long-distance", name: { en: "Long distance", "hi-Latn": "Long distance", hi: "दूरियाँ" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "lavender", emoji: "🌙", art: "moon",
    featuredTemplates: ["laal-dhaaga", "our-year-rewound", "quick-surprise"], landing: true, release: 1,
  },
  {
    slug: "sorry", name: { en: "Sorry", "hi-Latn": "Sorry", hi: "माफ़ी" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "rose", emoji: "🥺", art: "rose",
    featuredTemplates: ["sorry-wala-meter", "quick-surprise"], landing: true, release: 1,
  },
  {
    slug: "miss-you", name: { en: "Miss you", "hi-Latn": "Miss you", hi: "याद" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "lavender", emoji: "💌", art: "envelope",
    featuredTemplates: ["laal-dhaaga", "quick-surprise"], landing: true, release: 2,
  },
  {
    slug: "group-gifts", name: { en: "Group gifts", "hi-Latn": "Group gifts", hi: "ग्रुप गिफ्ट" },
    audience: "friends", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "rose", emoji: "🫶", art: "polaroid",
    featuredTemplates: ["sab-ki-taraf-se"], landing: true, release: 1,
  },
  {
    slug: "anniversary", name: { en: "Anniversary", "hi-Latn": "Anniversary", hi: "सालगिरह" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "rose", emoji: "💍", art: "rose",
    featuredTemplates: ["our-year-rewound", "laal-dhaaga", "sab-ki-taraf-se"], landing: true, release: 2,
  },
  {
    slug: "valentines-week", name: { en: "Valentine's Week", "hi-Latn": "Valentine Week", hi: "वैलेंटाइन वीक" },
    audience: "couple", regions: ["IN"], markets: ["IN"],
    dateRule: { kind: "fixed", md: "02-07" }, takeoverDaysBefore: 21, priority: 10, glow: "rose", emoji: "🌹", art: "rose",
    heroCopy: { en: "Rose Day is in {days} days", "hi-Latn": "Rose Day sirf {days} din door", hi: "रोज़ डे {days} दिन दूर" },
    featuredTemplates: ["sorry-wala-meter", "laal-dhaaga", "midnight-birthday"], landing: true, release: 2,
  },
  {
    slug: "valentines-day", name: { en: "Valentine's Day", "hi-Latn": "Valentine's Day", hi: "वैलेंटाइन डे" },
    audience: "couple", regions: ["global", "diaspora"], markets: ["GLOBAL"],
    dateRule: { kind: "fixed", md: "02-14" }, takeoverDaysBefore: 21, priority: 10, glow: "rose", emoji: "💘", art: "rose",
    heroCopy: { en: "Valentine's Day is in {days} days", "hi-Latn": "Valentine's Day {days} din mein", hi: "वैलेंटाइन डे {days} दिन में" },
    featuredTemplates: ["laal-dhaaga", "quick-surprise", "our-year-rewound"], landing: false, release: 2,
  },
  {
    slug: "galentines-day", name: { en: "Galentine's Day", "hi-Latn": "Galentine's Day", hi: "गैलेंटाइन डे" },
    audience: "friends", regions: ["global"], markets: ["GLOBAL"],
    dateRule: { kind: "fixed", md: "02-13" }, takeoverDaysBefore: 0, priority: 2, glow: "rose", emoji: "👯", art: "polaroid",
    featuredTemplates: ["sab-ki-taraf-se"], landing: false, release: 2,
  },
  {
    slug: "love-letter", name: { en: "Love letter", "hi-Latn": "Love letter", hi: "प्रेम पत्र" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "rose", emoji: "✉️", art: "envelope",
    featuredTemplates: ["quick-surprise", "laal-dhaaga"], landing: true, release: 2,
  },
  {
    slug: "proposal", name: { en: "Proposal", "hi-Latn": "Proposal", hi: "प्रपोज़" },
    audience: "couple", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "rose", emoji: "💍", art: "rose",
    featuredTemplates: ["laal-dhaaga"], landing: true, release: 2,
  },
  {
    slug: "diwali", name: { en: "Diwali", "hi-Latn": "Diwali", hi: "दिवाली" },
    audience: "everyone", regions: ["IN", "diaspora"], markets: BOTH,
    dateRule: { kind: "explicit", dates: { 2026: "2026-11-08", 2027: "2027-10-29" }, verify: [2027] },
    takeoverDaysBefore: 21, priority: 10, glow: "amber", emoji: "🪔", art: "lantern",
    heroCopy: { en: "Diwali from abroad? Send it to Maa tonight.", "hi-Latn": "Diwali {days} din door — ghar se door ho? Maa ko aaj raat bhejo.", hi: "दिवाली {days} दिन दूर" },
    featuredTemplates: ["sab-ki-taraf-se", "quick-surprise"], landing: true, release: 3,
  },
  {
    slug: "holi", name: { en: "Holi", "hi-Latn": "Holi", hi: "होली" },
    audience: "everyone", regions: ["IN", "diaspora"], markets: BOTH,
    dateRule: { kind: "explicit", dates: { 2027: "2027-03-22" }, verify: [2027] },
    takeoverDaysBefore: 14, priority: 8, glow: "rose", emoji: "🎨", art: "splash",
    featuredTemplates: ["sab-ki-taraf-se", "quick-surprise"], landing: true, release: 3,
  },
  {
    slug: "raksha-bandhan", name: { en: "Raksha Bandhan", "hi-Latn": "Rakhi", hi: "रक्षा बंधन" },
    audience: "family", regions: ["IN", "diaspora"], markets: BOTH,
    dateRule: { kind: "explicit", dates: { 2026: "2026-08-28", 2027: "2027-08-17" }, verify: [2027] },
    takeoverDaysBefore: 14, priority: 8, glow: "rose", emoji: "🧵", art: "thread",
    featuredTemplates: ["laal-dhaaga", "quick-surprise"], landing: true, release: 3,
  },
  {
    slug: "eid", name: { en: "Eid", "hi-Latn": "Eid", hi: "ईद" },
    audience: "everyone", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "explicit", dates: { 2027: "2027-03-10" }, verify: [2027] },
    takeoverDaysBefore: 10, priority: 8, glow: "lavender", emoji: "🌙", art: "moon",
    featuredTemplates: ["sab-ki-taraf-se", "quick-surprise"], landing: true, release: 3,
  },
  {
    slug: "lunar-new-year", name: { en: "Lunar New Year", "hi-Latn": "Lunar New Year", hi: "लूनर न्यू ईयर" },
    audience: "everyone", regions: ["global", "diaspora"], markets: BOTH,
    dateRule: { kind: "explicit", dates: { 2027: "2027-02-06" }, verify: [2027] },
    takeoverDaysBefore: 10, priority: 6, glow: "rose", emoji: "🧧", art: "lantern",
    featuredTemplates: ["sab-ki-taraf-se", "quick-surprise"], landing: true, release: 3,
  },
  {
    slug: "mothers-day", name: { en: "Mother's Day", "hi-Latn": "Mother's Day", hi: "मदर्स डे" },
    audience: "family", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "byCountry", default: { kind: "nthWeekday", month: 5, weekday: 0, n: 2 }, overrides: { GB: { kind: "easterOffset", days: -21 }, IE: { kind: "easterOffset", days: -21 } } },
    takeoverDaysBefore: 14, priority: 8, glow: "rose", emoji: "💐", art: "rose",
    featuredTemplates: ["sab-ki-taraf-se", "our-year-rewound"], landing: true, release: 3,
  },
  {
    slug: "fathers-day", name: { en: "Father's Day", "hi-Latn": "Father's Day", hi: "फादर्स डे" },
    audience: "family", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "byCountry", default: { kind: "nthWeekday", month: 6, weekday: 0, n: 3 }, overrides: { AU: { kind: "nthWeekday", month: 9, weekday: 0, n: 1 }, NZ: { kind: "nthWeekday", month: 9, weekday: 0, n: 1 } } },
    takeoverDaysBefore: 14, priority: 8, glow: "amber", emoji: "👔", art: "chai",
    featuredTemplates: ["sab-ki-taraf-se", "our-year-rewound"], landing: true, release: 3,
  },
  {
    slug: "friendship-day", name: { en: "Friendship Day", "hi-Latn": "Friendship Day", hi: "फ्रेंडशिप डे" },
    audience: "friends", regions: ["IN", "diaspora"], markets: ["IN"],
    dateRule: { kind: "nthWeekday", month: 8, weekday: 0, n: 1 },
    takeoverDaysBefore: 10, priority: 5, glow: "rose", emoji: "🤝", art: "polaroid",
    featuredTemplates: ["sab-ki-taraf-se"], landing: true, release: 3,
  },
  {
    slug: "thanksgiving", name: { en: "Thanksgiving", "hi-Latn": "Thanksgiving", hi: "थैंक्सगिविंग" },
    audience: "everyone", regions: ["global"], markets: ["GLOBAL"],
    dateRule: { kind: "nthWeekday", month: 11, weekday: 4, n: 4 },
    takeoverDaysBefore: 10, priority: 5, glow: "amber", emoji: "🍂", art: "chai",
    heroCopy: { en: "Thanksgiving is in {days} days — say thank you, together", "hi-Latn": "Thanksgiving {days} din mein", hi: "थैंक्सगिविंग {days} दिन में" },
    featuredTemplates: ["sab-ki-taraf-se", "quick-surprise", "laal-dhaaga"], landing: false, release: 3,
  },
  {
    slug: "invites", name: { en: "Party invites", "hi-Latn": "Party invites", hi: "पार्टी इनवाइट" },
    audience: "everyone", regions: ["IN", "diaspora", "global"], markets: BOTH,
    dateRule: { kind: "anytime" }, takeoverDaysBefore: 0, priority: 0, glow: "amber", emoji: "🎉", art: "fireworks",
    featuredTemplates: ["sab-ki-taraf-se"], landing: true, release: 3,
  },
];

export const RELEASE = Number(process.env.NEXT_PUBLIC_RELEASE ?? 1);

export function occasionBySlug(slug: string) {
  return OCCASIONS.find((o) => o.slug === slug);
}

/** Occasion slugs with a landing page live in the current release. */
export function landingOccasions(market?: Market) {
  return OCCASIONS.filter((o) => o.landing && o.release <= RELEASE && (!market || o.markets.includes(market)));
}

// ---------- date maths (pure, UTC-date based) ----------

function ymd(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

export function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(year, month, day);
}

export function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    const first = ymd(year, month, 1);
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return ymd(year, month, 1 + offset + (n - 1) * 7);
  }
  const last = ymd(year, month + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return ymd(year, month, last.getUTCDate() - offset);
}

export function dateForYear(rule: DateRule, year: number, country?: string | null): Date | null {
  switch (rule.kind) {
    case "fixed": {
      const [m, d] = rule.md.split("-").map(Number);
      return ymd(year, m, d);
    }
    case "nthWeekday":
      return nthWeekday(year, rule.month, rule.weekday, rule.n);
    case "explicit": {
      const s = rule.dates[year];
      return s ? new Date(s + "T00:00:00Z") : null;
    }
    case "easterOffset": {
      const e = easterSunday(year);
      return new Date(e.getTime() + rule.days * 86400000);
    }
    case "byCountry":
      return dateForYear((country && rule.overrides[country]) || rule.default, year, country);
    case "anytime":
      return null;
  }
}

/** Next occurrence on or after `today` (UTC date). */
export function nextOccurrence(o: Occasion, today: Date, country?: string | null): Date | null {
  const t = ymd(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
  for (const y of [t.getUTCFullYear(), t.getUTCFullYear() + 1]) {
    const d = dateForYear(o.dateRule, y, country);
    if (d && d.getTime() >= t.getTime()) return d;
  }
  return null;
}

export function daysUntil(d: Date, today: Date): number {
  const t = ymd(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

export type UpcomingOccasion = { occasion: Occasion; date: Date | null; days: number | null };

export function upcomingOccasions(market: Market, today: Date, country?: string | null): UpcomingOccasion[] {
  const list = OCCASIONS.filter((o) => o.markets.includes(market) && o.release <= Math.max(RELEASE, 1) + 2)
    .map((o) => {
      const date = nextOccurrence(o, today, country);
      return { occasion: o, date, days: date ? daysUntil(date, today) : null };
    })
    .filter((u) => u.days === null || u.days <= 200);
  return list.sort((a, b) => {
    if (a.days === null && b.days === null) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });
}

/** Active seasonal takeover, honouring `?season=` override. Highest priority wins; ties → nearest. */
export function activeTakeover(market: Market, today: Date, country?: string | null, override?: string | null): UpcomingOccasion | null {
  if (override) {
    const o = occasionBySlug(override);
    if (o) {
      const date = nextOccurrence(o, today, country);
      return { occasion: o, date, days: date ? daysUntil(date, today) : null };
    }
  }
  const active = upcomingOccasions(market, today, country).filter(
    (u) => u.days !== null && u.days <= u.occasion.takeoverDaysBefore && u.occasion.takeoverDaysBefore > 0,
  );
  active.sort((a, b) => b.occasion.priority - a.occasion.priority || (a.days ?? 0) - (b.days ?? 0));
  return active[0] ?? null;
}
