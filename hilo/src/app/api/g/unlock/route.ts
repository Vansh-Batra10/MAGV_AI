import { z } from "zod";
import { cookies } from "next/headers";
import { body, err, json, limit } from "@/lib/server/http";
import { getGiftBySlug } from "@/lib/server/gifts";
import { checkPassword } from "@/lib/server/password";
import { gateCookie, gateValue } from "@/lib/server/giftAccess";

const B = z.object({ slug: z.string().max(30), password: z.string().max(64) });

export async function POST(req: Request) {
  const b = await body(req, B);
  if (!b.ok) return b.res;
  if (!(await limit(`gate:${b.data.slug}`, 8, 600))) return err("too_many", 429);
  const g = await getGiftBySlug(b.data.slug);
  if (!g?.password_hash) return err("not_found", 404);
  if (!(await checkPassword(b.data.password, g.password_hash))) return err("wrong", 401);
  (await cookies()).set(gateCookie(g.slug!), gateValue(g), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
  return json({ ok: true });
}
