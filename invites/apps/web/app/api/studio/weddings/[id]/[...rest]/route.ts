import { NextResponse } from "next/server";
import { z } from "zod";
import { GuestVars, Locale, Tone, WeddingContent } from "@invites/content-schema";
import { entitlementsFor, type TierId } from "@invites/config";
import { AccessDenied, newId } from "@invites/db";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { dashboard, toCsv } from "@/lib/dashboard";
import { normalizePhone, parseCsv, parsePaste } from "@/lib/messages";
import { createRazorpayOrder, priceFor } from "@/lib/payments";
import { isMockMode } from "@invites/config";

type P = { params: Promise<{ id: string; rest: string[] }> };

async function ctx(p: P) {
  const u = await currentUser();
  const { id, rest } = await p.params;
  return { u, id, path: rest.join("/") };
}
const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

function wrap(fn: (req: Request, p: P) => Promise<Response>) {
  return async (req: Request, p: P) => {
    try { return await fn(req, p); } catch (e) {
      if (e instanceof AccessDenied) return fail(403, "not allowed");
      return fail(400, e instanceof Error ? e.message : "error");
    }
  };
}

export const GET = wrap(async (_req, p) => {
  const { u, id, path } = await ctx(p);
  if (!u) return fail(401, "login");
  const s = store();
  const w = s.wedding(u.id, id);
  const guests = s.guestsOf(u.id, id);
  const rsvps = s.rsvpsOf(u.id, id);
  if (path === "summary") {
    return NextResponse.json({ ok: true, wedding: w, guests, rsvps, pledges: s.pledgesOf(u.id, id), extras: s.extrasOf(u.id, id), dashboard: dashboard(w, guests, rsvps), entitlements: entitlementsFor(w.tier), appUrl: process.env.APP_URL ?? "http://localhost:3000" });
  }
  if (path === "export/guests.csv") {
    const byG = new Map(rsvps.map((r) => [r.guestId, r.submission]));
    const rows: (string | number)[][] = [["Guest", "Phone", "Side", "Group", "Link", ...w.content.events.flatMap((e) => [`${e.titleEn} status`, `${e.titleEn} adults`, `${e.titleEn} kids`]), "Food", "Allergies", "Arrival", "Mode", "Ref", "Pickup", "Stay", "Message"]];
    for (const g of guests) {
      const r = byG.get(g.id);
      rows.push([g.salutation, g.phone ?? "", g.side, w.groups.find((x) => x.id === g.groupId)?.name ?? "", `/${w.inviteCode}/${g.guestCode}`,
        ...w.content.events.flatMap((e) => { const en = r?.entries.find((x) => x.eventId === e.id); return g.invitedEventIds.includes(e.id) ? [en?.status ?? "pending", en?.adults ?? "", en?.kids ?? ""] : ["not invited", "", ""]; }),
        r?.food ?? "", r?.allergies ?? "", r?.arrivalAt ?? "", r?.arrivalMode ?? "", r?.refNo ?? "", r?.pickupNeeded ? "yes" : "", r?.stayNeeded ? "yes" : "", r?.message ?? ""]);
    }
    return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="guests-${w.inviteCode}.csv"` } });
  }
  if (path === "export/caterer.csv") {
    const d = dashboard(w, guests, rsvps);
    const rows: (string | number)[][] = [["Function", "Date", "Adults", "Kids", "Veg", "Jain", "Vegan", "Non-veg", "Not stated"], ...d.fns.map((f) => [f.title, f.startsAt.slice(0, 10), f.adults, f.kids, f.food.veg!, f.food.jain!, f.food.vegan!, f.food["non-veg"]!, f.food.unknown!])];
    return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="caterer-${w.inviteCode}.csv"` } });
  }
  return fail(404, "not found");
});

const GuestRow = z.object({
  salutation: z.string().trim().min(1).max(60), shortName: z.string().max(30).optional(), phone: z.string().optional(), groupId: z.string().optional(),
  invitedEventIds: z.array(z.string()).optional(), locale: Locale.optional(), tone: Tone.optional(), householdMax: z.number().int().min(1).max(20).optional(),
  shagunVisible: z.boolean().optional(), side: z.enum(["bride", "groom", "both"]).optional(), note: z.string().max(140).optional(), outstation: z.boolean().optional(), room: z.string().max(60).optional(),
});

export const POST = wrap(async (req, p) => {
  const { u, id, path } = await ctx(p);
  if (!u) return fail(401, "login");
  const s = store();
  const w = s.wedding(u.id, id, true);
  const body = await req.json().catch(() => ({}));
  if (path === "guests") {
    let rows: z.infer<typeof GuestRow>[] = [];
    if (typeof body.paste === "string") rows = parsePaste(body.paste);
    else if (typeof body.csv === "string") {
      const m = z.object({ name: z.number(), phone: z.number().optional(), group: z.number().optional(), header: z.boolean().default(true) }).parse(body.mapping);
      const data = parseCsv(body.csv).slice(m.header ? 1 : 0);
      rows = data.map((r) => ({ salutation: (r[m.name] ?? "").trim().slice(0, 60), phone: m.phone !== undefined ? r[m.phone] : undefined, groupId: m.group !== undefined ? w.groups.find((g) => g.name.toLowerCase() === (r[m.group!] ?? "").trim().toLowerCase())?.id : undefined })).filter((r) => r.salutation);
    } else rows = z.array(GuestRow).max(2000).parse(body.rows);
    const allEvents = w.content.events.map((e) => e.id);
    const made = s.addGuests(u.id, id, rows.map((r) => {
      const grp = w.groups.find((g) => g.id === r.groupId)?.defaults ?? {};
      const vars = GuestVars.omit({ guestCode: true }).parse({
        salutation: r.salutation, shortName: r.shortName, invitedEventIds: r.invitedEventIds ?? grp.invitedEventIds ?? allEvents,
        locale: r.locale ?? grp.locale ?? w.content.defaultLocale, tone: r.tone ?? grp.tone ?? w.content.defaultTone, householdMax: r.householdMax ?? grp.householdMax ?? 2,
        shagunVisible: r.shagunVisible ?? grp.shagunVisible ?? false, side: r.side ?? "both", note: r.note, outstation: r.outstation ?? false, room: r.room,
      });
      return { ...vars, phone: r.phone ? normalizePhone(r.phone) : undefined, groupId: r.groupId } as never;
    }));
    return NextResponse.json({ ok: true, added: made.length, skipped: rows.length - made.length });
  }
  if (path.startsWith("sent/")) { s.markSent(u.id, id, path.slice(5)); return NextResponse.json({ ok: true }); }
  if (path.startsWith("pledges/") && path.endsWith("/confirm")) { s.confirmPledge(u.id, id, path.split("/")[1]!); return NextResponse.json({ ok: true }); }
  if (path === "updates") { s.addUpdate(u.id, id, z.object({ message: z.string().trim().min(1).max(160) }).parse(body).message); return NextResponse.json({ ok: true }); }
  if (path === "groups") {
    const g = z.object({ name: z.string().trim().min(1).max(40), defaults: z.object({ locale: Locale.optional(), tone: Tone.optional(), invitedEventIds: z.array(z.string()).optional(), shagunVisible: z.boolean().optional() }).default({}) }).parse(body);
    s.updateWedding(u.id, id, { groups: [...w.groups, { id: newId(), ...g }] });
    return NextResponse.json({ ok: true });
  }
  if (path === "publish") { s.updateWedding(u.id, id, { status: "published" }); return NextResponse.json({ ok: true }); }
  if (path === "pay") {
    const { tier, currency } = z.object({ tier: z.enum(["classic", "signature", "couture"]), currency: z.enum(["INR", "USD"]).default("INR") }).parse(body);
    const amount = priceFor(tier as TierId, currency);
    const order = await createRazorpayOrder(amount, currency, `${w.id}-${Date.now()}`);
    const raw = s.raw();
    raw.orders.push({ id: order.id, weddingId: w.id, tier: tier as TierId, amountPaise: amount, currency, status: isMockMode() ? "paid" : "created", provider: isMockMode() ? "mock" : "razorpay", createdAt: new Date().toISOString() });
    if (isMockMode()) w.tier = tier as TierId;
    s.flush();
    return NextResponse.json({ ok: true, orderId: order.id, paid: isMockMode(), keyId: process.env.RAZORPAY_KEY_ID ?? null, amount, currency });
  }
  return fail(404, "not found");
});

export const PATCH = wrap(async (req, p) => {
  const { u, id, path } = await ctx(p);
  if (!u) return fail(401, "login");
  const s = store();
  const body = await req.json().catch(() => ({}));
  if (path === "wedding") {
    const b = z.object({ content: WeddingContent.optional(), templateId: z.enum(["sheesh-mahal", "rang-kahani", "mohar"]).optional(), packId: z.string().max(40).optional() }).parse(body);
    s.updateWedding(u.id, id, b);
    return NextResponse.json({ ok: true });
  }
  if (path.startsWith("guests/")) {
    const patch = GuestRow.partial().parse(body);
    s.updateGuest(u.id, id, path.slice(7), { ...patch, phone: patch.phone ? normalizePhone(patch.phone) : undefined } as never);
    return NextResponse.json({ ok: true });
  }
  return fail(404, "not found");
});

export const DELETE = wrap(async (_req, p) => {
  const { u, id, path } = await ctx(p);
  if (!u) return fail(401, "login");
  if (path.startsWith("guests/")) { store().deleteGuest(u.id, id, path.slice(7)); return NextResponse.json({ ok: true }); }
  return fail(404, "not found");
});
