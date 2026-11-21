import type { GuestVars, WeddingContent } from "@invites/content-schema";
import type { DbGuest, DbWedding } from "@invites/db";
import { store } from "./store";

/** What a guest's browser receives: only their functions, no couple contact data, shagun only if visible. */
export function guestView(w: DbWedding, g: DbGuest) {
  const invited = new Set(g.invitedEventIds);
  const content: WeddingContent = {
    ...w.content,
    events: w.content.events.filter((e) => invited.has(e.id)),
    shagun: g.shagunVisible && w.content.shagun?.enabled ? w.content.shagun : undefined,
    watermark: w.tier === "preview",
    hideBrandFooter: w.content.hideBrandFooter && w.tier === "couture",
  };
  const guest: GuestVars = {
    guestCode: g.guestCode, salutation: g.salutation, shortName: g.shortName, invitedEventIds: g.invitedEventIds, locale: g.locale, tone: g.tone,
    householdMax: g.householdMax, shagunVisible: g.shagunVisible, side: g.side, note: g.note, room: g.room, outstation: g.outstation,
    lastVisitAt: g.lastOpenedAt, replied: g.replied,
  };
  const s = store();
  return {
    templateId: w.templateId, packId: w.packId, content, guest,
    existingRsvp: s.rsvpFor(g.id),
    publicCounts: { confirmedHouseholds: s.confirmedHouseholds(w.id), ...(() => { const c = s.teamCounts(w.id); return { teamLadkewale: c.ladkewale, teamLadkiwale: c.ladkiwale }; })() },
  };
}
export type GuestViewData = ReturnType<typeof guestView>;
