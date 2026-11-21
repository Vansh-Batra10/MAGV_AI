import type { DbGuest, DbRsvp, DbWedding } from "@invites/db";

export function dashboard(w: DbWedding, guests: DbGuest[], rsvps: DbRsvp[]) {
  const byGuest = new Map(rsvps.map((r) => [r.guestId, r]));
  const fns = w.content.events.map((e) => {
    const invited = guests.filter((g) => g.invitedEventIds.includes(e.id));
    let adults = 0, kids = 0, yes = 0, no = 0, maybe = 0;
    const food: Record<string, number> = { veg: 0, jain: 0, vegan: 0, "non-veg": 0, unknown: 0 };
    for (const g of invited) {
      const r = byGuest.get(g.id);
      const en = r?.submission.entries.find((x) => x.eventId === e.id);
      if (!en) continue;
      if (en.status === "yes") { yes++; adults += en.adults; kids += en.kids; food[r!.submission.food ?? "unknown"]! += en.adults + en.kids; }
      else if (en.status === "no") no++; else maybe++;
    }
    return { id: e.id, title: e.titleEn, startsAt: e.startsAt, invited: invited.length, yes, no, maybe, pending: invited.length - yes - no - maybe, adults, kids, food };
  });
  const sent = guests.filter((g) => g.sentAt).length;
  const opened = guests.filter((g) => g.firstOpenedAt).length;
  const replied = guests.filter((g) => byGuest.has(g.id)).length;
  return {
    fns, totals: { guests: guests.length, sent, opened, replied },
    openedNotReplied: guests.filter((g) => g.firstOpenedAt && !byGuest.has(g.id)).map((g) => ({ id: g.id, salutation: g.salutation })),
    pending: guests.filter((g) => !byGuest.has(g.id)).map((g) => ({ id: g.id, salutation: g.salutation, sent: !!g.sentAt })),
    outstation: guests.filter((g) => g.outstation || byGuest.get(g.id)?.submission.stayNeeded || byGuest.get(g.id)?.submission.pickupNeeded).map((g) => {
      const s = byGuest.get(g.id)?.submission;
      return { id: g.id, salutation: g.salutation, room: g.room ?? "", arrival: s?.arrivalAt ?? "", mode: s?.arrivalMode ?? "", ref: s?.refNo ?? "", pickup: !!s?.pickupNeeded, stay: !!s?.stayNeeded };
    }),
  };
}

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const cell = (v: unknown) => { const s = v == null ? "" : String(v); const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}
