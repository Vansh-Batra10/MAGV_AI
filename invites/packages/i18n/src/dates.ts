import type { Locale } from "@invites/content-schema/client";

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_HINGLISH = ["Raviwaar", "Somwaar", "Mangalwaar", "Budhwaar", "Guruwaar", "Shukrawaar", "Shanivaar"];
const DAYS_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_HINGLISH = ["Janvari", "Farvari", "March", "April", "Mayi", "June", "Julai", "Agast", "Sitambar", "Aktoobar", "Navambar", "Disambar"];
const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
const DEV_DIGITS = "०१२३४५६७८९";

export function toDevanagariDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => DEV_DIGITS[Number(d)]!);
}

/** Wall-clock parts of an ISO instant in a time zone (deterministic, no locale data needed). */
export function zonedParts(iso: string, tz = "Asia/Kolkata") {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday as string);
  return { year: Number(p.year), month: Number(p.month) - 1, day: Number(p.day), hour: Number(p.hour), minute: Number(p.minute), weekday: wd };
}

export interface DateOpts { tz?: string; devanagariNumerals?: boolean }

export function formatDate(iso: string, locale: Locale, o: DateOpts = {}): string {
  const z = zonedParts(iso, o.tz);
  let s: string;
  if (locale === "hi") s = `${DAYS_HI[z.weekday]}, ${z.day} ${MONTHS_HI[z.month]} ${z.year}`;
  else if (locale === "hinglish") s = `${DAYS_HINGLISH[z.weekday]}, ${z.day} ${MONTHS_HINGLISH[z.month]} ${z.year}`;
  else s = `${DAYS_EN[z.weekday]}, ${z.day} ${MONTHS_EN[z.month]} ${z.year}`;
  return o.devanagariNumerals && locale === "hi" ? toDevanagariDigits(s) : s;
}

export function formatDayMonth(iso: string, locale: Locale, o: DateOpts = {}): { day: string; month: string; weekday: string; year: string } {
  const z = zonedParts(iso, o.tz);
  const months = locale === "hi" ? MONTHS_HI : locale === "hinglish" ? MONTHS_HINGLISH : MONTHS_EN;
  const days = locale === "hi" ? DAYS_HI : locale === "hinglish" ? DAYS_HINGLISH : DAYS_EN;
  const dev = o.devanagariNumerals && locale === "hi";
  return {
    day: dev ? toDevanagariDigits(String(z.day)) : String(z.day),
    month: months[z.month]!,
    weekday: days[z.weekday]!,
    year: dev ? toDevanagariDigits(String(z.year)) : String(z.year),
  };
}

export function formatTime(iso: string, locale: Locale, o: DateOpts = {}): string {
  const z = zonedParts(iso, o.tz);
  const h12 = ((z.hour + 11) % 12) + 1;
  const mm = String(z.minute).padStart(2, "0");
  if (locale === "hi") {
    const part = z.hour < 12 ? "सुबह" : z.hour < 16 ? "दोपहर" : z.hour < 19 ? "शाम" : "रात";
    const s = `${part} ${h12}:${mm} बजे`;
    return o.devanagariNumerals ? toDevanagariDigits(s) : s;
  }
  if (locale === "hinglish") {
    const part = z.hour < 12 ? "subah" : z.hour < 16 ? "dopahar" : z.hour < 19 ? "shaam" : "raat";
    return `${part} ${h12}:${mm} baje`;
  }
  return `${h12}:${mm} ${z.hour < 12 ? "AM" : "PM"}`;
}

export function sameLocalDay(aIso: string, b: Date, tz = "Asia/Kolkata"): boolean {
  const x = zonedParts(aIso, tz), y = zonedParts(b.toISOString(), tz);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}
