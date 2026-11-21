import type { Locale, Tone } from "@invites/content-schema";

/** WhatsApp message per language/tone. The guest's personal link is always on its own line. */
export function inviteMessage(o: { locale: Locale; tone: Tone; salutation: string; names: string; link: string }): string {
  const { salutation: s, names: n, link } = o;
  if (o.locale === "hi") return `${s},\nसादर आमंत्रण 🙏\n${n} के शुभ विवाह में आपकी उपस्थिति हमारा सौभाग्य होगी।\nनिमंत्रण यहाँ देखें:\n${link}`;
  if (o.locale === "hinglish") {
    if (o.tone === "playful") return `Arre ${s}! 🎉\n${n} ki shaadi hai, aana hi padega!\nTera invite yahan hai:\n${link}`;
    return `${s}, aapko saadar nimantran 🙏\n${n} ki shaadi mein aapka intezaar rahega.\nNimantran yahan dekhiye:\n${link}`;
  }
  if (o.tone === "playful") return `Hey ${s}! 🎉 ${n} are getting married and you HAVE to be there.\nYour invite:\n${link}`;
  return `Dear ${s},\nWith the blessings of our families, we warmly invite you to the wedding of ${n}.\nYour invitation:\n${link}`;
}

export function waLink(phoneE164: string | undefined, text: string): string {
  const num = (phoneE164 ?? "").replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
export function smsLink(phoneE164: string | undefined, text: string): string {
  return `sms:${phoneE164 ?? ""}?&body=${encodeURIComponent(text)}`;
}

/** Parse "Name, phone" lines (paste list). Indian 10-digit numbers get +91. */
export function parsePaste(text: string): { salutation: string; phone?: string }[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)[,\t;]\s*([+\d][\d\s-]{6,})$/);
    if (!m) return { salutation: l.slice(0, 60) };
    return { salutation: m[1]!.trim().slice(0, 60), phone: normalizePhone(m[2]!) };
  });
}
export function normalizePhone(raw: string): string | undefined {
  const d = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(d)) return d;
  const digits = d.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return undefined;
}

/** CSV → rows with a column mapping { name: idx, phone: idx, group?: idx }. Handles quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
