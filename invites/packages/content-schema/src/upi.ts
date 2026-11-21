/**
 * UPI intent builder (§11). We never hold or route money: the URI pays the couple's own VPA.
 * TODO_VERIFY(UPI note `tn` max length and allowed characters per NPCI spec) — 50 chars is a conservative cap.
 */
export const UPI_NOTE_MAX = 50;

export interface UpiParams {
  vpa: string;
  payeeName: string;
  amount?: number | null;
  note?: string;
}

const VPA_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function sanitizeUpiNote(note: string): string {
  // Keep it to safe printable ASCII: some UPI apps reject emoji / non-ASCII in tn.
  return note.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim().slice(0, UPI_NOTE_MAX);
}

export function buildUpiUri(p: UpiParams): string {
  if (!VPA_RE.test(p.vpa)) throw new Error("Invalid UPI ID");
  const parts: string[] = [`pa=${encodeURIComponent(p.vpa)}`, `pn=${encodeURIComponent(p.payeeName.trim().slice(0, 60))}`];
  if (p.amount != null) {
    if (!Number.isFinite(p.amount) || p.amount <= 0) throw new Error("Invalid amount");
    parts.push(`am=${p.amount.toFixed(2)}`);
  }
  parts.push("cu=INR");
  if (p.note) {
    const tn = sanitizeUpiNote(p.note);
    if (tn) parts.push(`tn=${encodeURIComponent(tn)}`);
  }
  return `upi://pay?${parts.join("&")}`;
}
