import type { WeddingEvent } from "./schema";

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A single-event .ics file. Default duration 4 h when no end time is set. */
export function buildIcs(e: WeddingEvent, title: string, uidDomain = "invite"): string {
  const end = e.endsAt ?? new Date(Date.parse(e.startsAt) + 4 * 3600_000).toISOString();
  const loc = [e.venueName, e.venueAddress ?? e.venueArea].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//invites//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.id}@${uidDomain}`, `DTSTAMP:${icsDate(e.startsAt)}`, `DTSTART:${icsDate(e.startsAt)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(loc)}`, "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export function googleCalendarUrl(e: WeddingEvent, title: string): string {
  const end = e.endsAt ?? new Date(Date.parse(e.startsAt) + 4 * 3600_000).toISOString();
  const loc = [e.venueName, e.venueAddress ?? e.venueArea].filter(Boolean).join(", ");
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${icsDate(e.startsAt)}/${icsDate(end)}`, location: loc });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function directionsUrls(e: WeddingEvent): { google: string; apple: string } {
  const q = e.lat != null && e.lng != null ? `${e.lat},${e.lng}` : [e.venueName, e.venueAddress ?? e.venueArea].filter(Boolean).join(", ");
  return {
    google: e.mapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`,
    apple: `https://maps.apple.com/?daddr=${encodeURIComponent(q)}`,
  };
}
