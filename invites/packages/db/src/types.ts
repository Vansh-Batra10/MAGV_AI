import type { GuestVars, RsvpSubmission, WeddingContent } from "@invites/content-schema";
import type { TierId } from "@invites/config";

export interface DbUser { id: string; phone: string; name?: string; email?: string; role: "couple" | "admin"; createdAt: string }
export interface DbGroup { id: string; name: string; defaults: Partial<Pick<GuestVars, "locale" | "tone" | "invitedEventIds" | "shagunVisible" | "householdMax">> }
export interface DbWedding {
  id: string; ownerUserId: string; members: { userId: string; role: "owner" | "editor" | "viewer" }[];
  inviteCode: string; templateId: string; packId: string; tier: TierId; status: "draft" | "published" | "archived";
  content: WeddingContent; groups: DbGroup[]; createdAt: string; updatedAt: string; firstSentAt?: string;
  shagunVerifiedAt?: string; vpaLockedUntil?: string;
}
export interface DbGuest extends GuestVars {
  id: string; weddingId: string; groupId?: string; phone?: string; email?: string;
  sentAt?: string; firstOpenedAt?: string; lastOpenedAt?: string; createdAt: string;
}
export interface DbRsvp { guestId: string; weddingId: string; submission: RsvpSubmission; updatedAt: string }
export interface DbPledge { id: string; weddingId: string; guestId: string; blockId: string; amount: number | null; pledgedAt: string; confirmedAt?: string }
export interface DbClaim { weddingId: string; giftId: string; guestId: string; at: string }
export interface DbVote { weddingId: string; guestId: string; team: "ladkewale" | "ladkiwale" }
export interface DbSong { weddingId: string; guestId: string; text: string; at: string }
export interface DbBlessing { weddingId: string; guestId: string; blessing: string; signatureSvg?: string; at: string }
export interface DbOpen { weddingId: string; guestId: string; at: string; scene?: string; tier?: string; ua?: string }
export interface DbReport { id: string; weddingId: string; reason: string; at: string; status: "open" | "closed" }
export interface DbOrder { id: string; weddingId: string; tier: TierId; amountPaise: number; currency: "INR" | "USD"; status: "created" | "paid" | "refunded"; provider: string; providerRef?: string; createdAt: string }
export interface DbExportJob { id: string; weddingId: string; kind: string; params: Record<string, unknown>; status: "queued" | "running" | "done" | "failed"; progress: number; output?: string; error?: string; createdAt: string }

export interface DbShape {
  users: DbUser[]; weddings: DbWedding[]; guests: DbGuest[]; rsvps: DbRsvp[]; pledges: DbPledge[]; claims: DbClaim[];
  votes: DbVote[]; songs: DbSong[]; blessings: DbBlessing[]; opens: DbOpen[]; reports: DbReport[]; orders: DbOrder[]; exportJobs: DbExportJob[];
  otps: { phone: string; code: string; expiresAt: string }[];
  sessions: { token: string; userId: string; expiresAt: string }[];
}
