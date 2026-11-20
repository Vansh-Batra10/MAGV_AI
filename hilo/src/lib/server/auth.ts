import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ENV, MOCK } from "./env";
import { q, one } from "./db";
import { newId, newCode } from "@/lib/ids";
import { send } from "./adapters/messaging";

const COOKIE = "hilo_session";
const key = () => new TextEncoder().encode(ENV.authSecret);

export type Session = { uid: string; email: string };
export type Profile = { id: string; email: string; name: string | null; phone: string | null; market: string; currency: string; referral_code: string; wallet_balance_minor: number; is_partner: boolean };

export async function getSession(): Promise<Session | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, key());
    return { uid: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  const s = await getSession();
  if (!s) return null;
  return one<Profile>(`select * from profiles where id=$1`, [s.uid]);
}

export async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  return !!s && ENV.adminEmails.includes(s.email.toLowerCase());
}

function hashCode(email: string, code: string) {
  return crypto.createHmac("sha256", ENV.authSecret).update(`${email}|${code}`).digest("hex");
}

/** Email OTP. In MOCK email mode the code is also returned so the UI can show it (dev only). */
export async function startEmailLogin(emailRaw: string, lang: string): Promise<{ ok: true; devCode?: string }> {
  const email = emailRaw.trim().toLowerCase();
  const code = String(crypto.randomInt(100000, 999999));
  await q(`delete from auth_codes where email=$1`, [email]);
  await q(`insert into auth_codes (id,email,code_hash,expires_at) values ($1,$2,$3, now() + interval '15 minutes')`, [newId(), email, hashCode(email, code)]);
  const hinglish = lang === "hi-Latn";
  await send({
    channel: "email", to: email, template: "login_code", category: "authentication",
    subject: hinglish ? `Tumhara login code: ${code}` : `Your sign-in code: ${code}`,
    text: hinglish ? `Tumhara code ${code} hai. 15 minute mein expire hoga.` : `Your code is ${code}. It expires in 15 minutes.`,
  });
  return MOCK.email ? { ok: true, devCode: code } : { ok: true };
}

export async function verifyEmailLogin(emailRaw: string, code: string): Promise<Session | null> {
  const email = emailRaw.trim().toLowerCase();
  const row = await one<{ id: string; code_hash: string; attempts: number }>(
    `select id, code_hash, attempts from auth_codes where email=$1 and expires_at > now()`, [email]);
  if (!row || row.attempts >= 5) return null;
  if (row.code_hash !== hashCode(email, code.trim())) {
    await q(`update auth_codes set attempts = attempts + 1 where id=$1`, [row.id]);
    return null;
  }
  await q(`delete from auth_codes where id=$1`, [row.id]);
  let p = await one<{ id: string }>(`select id from profiles where email=$1`, [email]);
  if (!p) {
    p = { id: newId() };
    await q(`insert into profiles (id,email,referral_code) values ($1,$2,$3)`, [p.id, email, newCode()]);
  }
  // Claim guest gifts bought with this (now verified) email.
  await q(`update gifts set owner_id=$1 where owner_id is null and id in (select gift_id from orders where lower(buyer_email)=$2)`, [p.id, email]);
  await q(`update orders set user_id=$1 where user_id is null and lower(buyer_email)=$2`, [p.id, email]);
  const s = { uid: p.id, email };
  await setSession(s);
  return s;
}

export async function setSession(s: Session) {
  const token = await new SignJWT({ email: s.email }).setProtectedHeader({ alg: "HS256" }).setSubject(s.uid).setIssuedAt().setExpirationTime("60d").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 60 });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
