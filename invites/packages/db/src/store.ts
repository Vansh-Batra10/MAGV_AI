import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { sampleGuests, sampleWedding, type GuestVars, type RsvpSubmission } from "@invites/content-schema";
import { entitlementsFor } from "@invites/config";
import { base62, newId } from "./codes";
import type { DbGuest, DbShape, DbWedding } from "./types";

/**
 * MOCK-mode store: a JSON file (default `.data/db.json`). The Supabase adapter implements the same
 * methods against the SQL schema in migrations/. Access rules mirror RLS: couple-facing methods take the
 * acting user id and refuse other weddings; guest-facing methods are scoped by (inviteCode, guestCode).
 */
export class AccessDenied extends Error { constructor() { super("access denied"); } }

const now = () => new Date().toISOString();

function empty(): DbShape {
  return { users: [], weddings: [], guests: [], rsvps: [], pledges: [], claims: [], votes: [], songs: [], blessings: [], opens: [], reports: [], orders: [], exportJobs: [], otps: [], sessions: [] };
}

export function seed(db: DbShape): DbShape {
  const owner = { id: "user-demo", phone: "+919800000000", name: "Ananya", role: "couple" as const, createdAt: now() };
  const admin = { id: "user-admin", phone: "+919800000001", name: "Admin", role: "admin" as const, createdAt: now() };
  db.users.push(owner, admin);
  for (const [code, tpl, pack] of [["demo", "sheesh-mahal", "jaipur-dusk"], ["demo-rk", "rang-kahani", "bombay-monsoon"], ["demo-mh", "mohar", "plum-olive"]] as const) {
    const w: DbWedding = {
      id: `w-${code}`, ownerUserId: owner.id, members: [{ userId: owner.id, role: "owner" }], inviteCode: code, templateId: tpl, packId: pack,
      tier: "signature", status: "published", content: { ...sampleWedding, inviteId: `w-${code}` }, createdAt: now(), updatedAt: now(), shagunVerifiedAt: now(),
      groups: [
        { id: "g-family", name: "Parivaar", defaults: { locale: "hi", tone: "formal", shagunVisible: false } },
        { id: "g-friends", name: "Dost", defaults: { locale: "hinglish", tone: "playful", shagunVisible: true } },
        { id: "g-office", name: "Papa ke office", defaults: { locale: "en", tone: "formal", invitedEventIds: ["wedding", "reception"], shagunVisible: false } },
      ],
    };
    db.weddings.push(w);
    const suffix = code === "demo" ? "" : code.slice(5);
    for (const [k, g] of Object.entries(sampleGuests)) {
      db.guests.push({ ...g, guestCode: g.guestCode + suffix, id: `${w.id}-${k}`, weddingId: w.id, groupId: k === "elder" ? "g-family" : k === "friend" ? "g-friends" : "g-office", phone: k === "friend" ? "+919811111111" : undefined, createdAt: now() });
    }
  }
  return db;
}

export class Store {
  private db: DbShape;
  constructor(private file: string | null = null) {
    if (file && existsSync(file)) this.db = JSON.parse(readFileSync(file, "utf8"));
    else { this.db = seed(empty()); this.flush(); }
  }
  raw(): DbShape { return this.db; }
  flush(): void {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.db));
    renameSync(tmp, this.file);
  }

  // ---------------- guest-scoped (token = codes) ----------------
  guestBundle(inviteCode: string, guestCode: string): { wedding: DbWedding; guest: DbGuest } | null {
    const wedding = this.db.weddings.find((w) => w.inviteCode === inviteCode && w.status !== "archived");
    if (!wedding) return null;
    const guest = this.db.guests.find((g) => g.weddingId === wedding.id && g.guestCode === guestCode);
    return guest ? { wedding, guest } : null;
  }
  weddingByCode(inviteCode: string): DbWedding | null { return this.db.weddings.find((w) => w.inviteCode === inviteCode && w.status !== "archived") ?? null; }

  /** Records an open and returns the previous last visit (for update banners). */
  recordOpen(guest: DbGuest, meta: { scene?: string; tier?: string; ua?: string } = {}): string | undefined {
    const prev = guest.lastOpenedAt;
    const at = now();
    if (!meta.scene || meta.scene === "loader") {
      guest.firstOpenedAt ??= at;
      guest.lastOpenedAt = at;
    }
    this.db.opens.push({ weddingId: guest.weddingId, guestId: guest.id, at, scene: meta.scene, tier: meta.tier, ua: meta.ua });
    this.flush();
    return prev;
  }
  rsvpFor(guestId: string): RsvpSubmission | null { return this.db.rsvps.find((r) => r.guestId === guestId)?.submission ?? null; }
  saveRsvp(guest: DbGuest, sub: RsvpSubmission): void {
    const invited = new Set(guest.invitedEventIds);
    const clean: RsvpSubmission = { ...sub, entries: sub.entries.filter((e) => invited.has(e.eventId)).map((e) => ({ ...e, adults: Math.min(e.adults, guest.householdMax), kids: Math.min(e.kids, guest.householdMax) })) };
    const ex = this.db.rsvps.find((r) => r.guestId === guest.id);
    if (ex) { ex.submission = clean; ex.updatedAt = now(); } else this.db.rsvps.push({ guestId: guest.id, weddingId: guest.weddingId, submission: clean, updatedAt: now() });
    guest.replied = true;
    this.flush();
  }
  pledge(guest: DbGuest, blockId: string, amount: number | null): void {
    const w = this.db.weddings.find((x) => x.id === guest.weddingId)!;
    const exists = w.content.shagun?.funds.some((f) => f.blocks.some((b) => b.id === blockId));
    if (!exists || !guest.shagunVisible || !w.content.shagun?.enabled) throw new AccessDenied();
    this.db.pledges.push({ id: newId(), weddingId: w.id, guestId: guest.id, blockId, amount, pledgedAt: now() });
    this.flush();
  }
  claimGift(guest: DbGuest, giftId: string): boolean {
    const w = this.db.weddings.find((x) => x.id === guest.weddingId)!;
    const gift = w.content.shagun?.gifts.find((g) => g.id === giftId);
    if (!gift || gift.claimed) return false;
    gift.claimed = true;
    this.db.claims.push({ weddingId: w.id, giftId, guestId: guest.id, at: now() });
    this.flush();
    return true;
  }
  vote(guest: DbGuest, team: "ladkewale" | "ladkiwale") {
    const ex = this.db.votes.find((v) => v.guestId === guest.id);
    if (ex) ex.team = team; else this.db.votes.push({ weddingId: guest.weddingId, guestId: guest.id, team });
    this.flush();
    return this.teamCounts(guest.weddingId);
  }
  teamCounts(weddingId: string) {
    const v = this.db.votes.filter((x) => x.weddingId === weddingId);
    return { ladkewale: v.filter((x) => x.team === "ladkewale").length, ladkiwale: v.filter((x) => x.team === "ladkiwale").length };
  }
  song(guest: DbGuest, text: string) { this.db.songs.push({ weddingId: guest.weddingId, guestId: guest.id, text: text.slice(0, 100), at: now() }); this.flush(); }
  sign(guest: DbGuest, blessing: string, signatureSvg?: string) {
    if (signatureSvg && !/^<svg[^>]*><path d="[MLml0-9 ,.-]*"[^>]*\/><\/svg>$/.test(signatureSvg)) signatureSvg = undefined; // only our own path markup
    this.db.blessings.push({ weddingId: guest.weddingId, guestId: guest.id, blessing: blessing.slice(0, 160), signatureSvg, at: now() });
    this.flush();
  }
  report(weddingId: string, reason: string) { this.db.reports.push({ id: newId(), weddingId, reason: reason.slice(0, 500), at: now(), status: "open" }); this.flush(); }
  confirmedHouseholds(weddingId: string): number {
    return this.db.rsvps.filter((r) => r.weddingId === weddingId && r.submission.entries.some((e) => e.status === "yes")).length;
  }

  // ---------------- couple-scoped (mirrors RLS) ----------------
  private assertMember(userId: string, w: DbWedding, write = false) {
    const user = this.db.users.find((u) => u.id === userId);
    if (user?.role === "admin") return;
    const m = w.members.find((x) => x.userId === userId);
    if (!m || (write && m.role === "viewer")) throw new AccessDenied();
  }
  weddingsFor(userId: string): DbWedding[] { return this.db.weddings.filter((w) => w.members.some((m) => m.userId === userId)); }
  wedding(userId: string, id: string, write = false): DbWedding {
    const w = this.db.weddings.find((x) => x.id === id);
    if (!w) throw new AccessDenied();
    this.assertMember(userId, w, write);
    return w;
  }
  guestsOf(userId: string, weddingId: string): DbGuest[] { this.wedding(userId, weddingId); return this.db.guests.filter((g) => g.weddingId === weddingId); }
  rsvpsOf(userId: string, weddingId: string) { this.wedding(userId, weddingId); return this.db.rsvps.filter((r) => r.weddingId === weddingId); }
  pledgesOf(userId: string, weddingId: string) { this.wedding(userId, weddingId); return this.db.pledges.filter((r) => r.weddingId === weddingId); }
  extrasOf(userId: string, weddingId: string) {
    this.wedding(userId, weddingId);
    const f = <T extends { weddingId: string }>(a: T[]) => a.filter((x) => x.weddingId === weddingId);
    return { songs: f(this.db.songs), blessings: f(this.db.blessings), votes: this.teamCounts(weddingId), claims: f(this.db.claims), opens: f(this.db.opens) };
  }
  createWedding(userId: string, init: Pick<DbWedding, "templateId" | "packId" | "content">): DbWedding {
    const w: DbWedding = { id: newId(), ownerUserId: userId, members: [{ userId, role: "owner" }], inviteCode: base62(8), templateId: init.templateId, packId: init.packId, tier: "preview", status: "draft", content: init.content, groups: [], createdAt: now(), updatedAt: now() };
    w.content = { ...w.content, inviteId: w.id };
    this.db.weddings.push(w);
    this.flush();
    return w;
  }
  updateWedding(userId: string, id: string, patch: Partial<Pick<DbWedding, "templateId" | "packId" | "content" | "status" | "groups">>): DbWedding {
    const w = this.wedding(userId, id, true);
    if (patch.content) {
      // VPA is locked after setup: changing it needs OTP + 24 h cool-down (handled by the shagun settings flow).
      const oldVpa = w.content.shagun?.vpa, newVpa = patch.content.shagun?.vpa;
      if (oldVpa && newVpa && oldVpa !== newVpa && w.vpaLockedUntil && Date.parse(w.vpaLockedUntil) > Date.now()) throw new Error("UPI ID is locked; try after the cool-down");
      if (patch.content.shagun?.enabled && !w.shagunVerifiedAt) throw new Error("Verify your phone before enabling shagun");
      if (patch.content.shagun?.enabled && !entitlementsFor(w.tier).shagun) throw new Error("Shagun needs the Signature plan");
      patch.content = { ...patch.content, inviteId: w.id };
      if (oldVpa && newVpa && oldVpa !== newVpa) w.vpaLockedUntil = new Date(Date.now() + 24 * 3600_000).toISOString();
    }
    Object.assign(w, patch, { updatedAt: now() });
    this.flush();
    return w;
  }
  addGuests(userId: string, weddingId: string, rows: Omit<GuestVars, "guestCode">[] & { phone?: string }[]): DbGuest[] {
    const w = this.wedding(userId, weddingId, true);
    const max = entitlementsFor(w.tier).maxGuestLinks;
    const existing = this.db.guests.filter((g) => g.weddingId === weddingId);
    const out: DbGuest[] = [];
    for (const r of rows as (Omit<GuestVars, "guestCode"> & { phone?: string; groupId?: string })[]) {
      if (r.phone && existing.some((g) => g.phone === r.phone)) continue; // duplicate merge by phone
      if (max !== null && w.tier !== "preview" && existing.length + out.length >= max) break;
      const g: DbGuest = { ...r, guestCode: base62(10), id: newId(), weddingId, createdAt: now() } as DbGuest;
      out.push(g);
    }
    this.db.guests.push(...out);
    this.flush();
    return out;
  }
  updateGuest(userId: string, weddingId: string, guestId: string, patch: Partial<DbGuest>): DbGuest {
    this.wedding(userId, weddingId, true);
    const g = this.db.guests.find((x) => x.id === guestId && x.weddingId === weddingId);
    if (!g) throw new AccessDenied();
    const { id: _i, weddingId: _w, guestCode: _c, ...safe } = patch;
    Object.assign(g, safe);
    this.flush();
    return g;
  }
  deleteGuest(userId: string, weddingId: string, guestId: string) {
    this.wedding(userId, weddingId, true);
    this.db.guests = this.db.guests.filter((g) => !(g.id === guestId && g.weddingId === weddingId));
    this.flush();
  }
  markSent(userId: string, weddingId: string, guestId: string) {
    const w = this.wedding(userId, weddingId, true);
    const g = this.db.guests.find((x) => x.id === guestId && x.weddingId === weddingId);
    if (!g) throw new AccessDenied();
    g.sentAt = now();
    w.firstSentAt ??= g.sentAt;
    this.flush();
  }
  confirmPledge(userId: string, weddingId: string, pledgeId: string) {
    this.wedding(userId, weddingId, true);
    const p = this.db.pledges.find((x) => x.id === pledgeId && x.weddingId === weddingId);
    if (!p) throw new AccessDenied();
    p.confirmedAt = now();
    this.flush();
  }
  addUpdate(userId: string, weddingId: string, message: string) {
    const w = this.wedding(userId, weddingId, true);
    w.content.updates = [...w.content.updates, { id: newId(), message: message.slice(0, 160), at: now() }];
    this.flush();
  }
}
