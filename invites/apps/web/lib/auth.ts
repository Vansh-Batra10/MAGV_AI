import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { base62 } from "@invites/db";
import { isMockMode } from "@invites/config";
import { store } from "./store";

const COOKIE = "inv_session";

/** Phone OTP. MOCK mode returns the code to the client (no SMS); real mode would call the SMS/Supabase provider. */
export function issueOtp(phone: string): { mockCode?: string } {
  const s = store().raw();
  const code = String(randomInt(100000, 999999));
  s.otps = s.otps.filter((o) => o.phone !== phone);
  s.otps.push({ phone, code, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() });
  store().flush();
  return isMockMode() ? { mockCode: code } : {};
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const st = store(); const s = st.raw();
  const o = s.otps.find((x) => x.phone === phone && x.code === code && Date.parse(x.expiresAt) > Date.now());
  if (!o) return false;
  s.otps = s.otps.filter((x) => x !== o);
  let user = s.users.find((u) => u.phone === phone);
  if (!user) { user = { id: base62(16), phone, role: "couple", createdAt: new Date().toISOString() }; s.users.push(user); }
  const token = base62(32);
  s.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString() });
  // phone is verified: shagun can be enabled on this user's weddings
  for (const w of s.weddings) if (w.ownerUserId === user.id) w.shagunVerifiedAt ??= new Date().toISOString();
  st.flush();
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: (process.env.APP_URL ?? "").startsWith("https://"), path: "/", maxAge: 30 * 86400 });
  return true;
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = store().raw();
  const sess = s.sessions.find((x) => x.token === token && Date.parse(x.expiresAt) > Date.now());
  return sess ? s.users.find((u) => u.id === sess.userId) ?? null : null;
}

export async function logout() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  const s = store().raw();
  s.sessions = s.sessions.filter((x) => x.token !== token);
  store().flush();
  c.delete(COOKIE);
}
