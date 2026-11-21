import type { GuestVars, Person, WeddingContent, WeddingEvent } from "./schema";

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
