import { z } from "zod";
import { body, err, json, limit } from "@/lib/server/http";
import { verifyEmailLogin } from "@/lib/server/auth";

const B = z.object({ email: z.string().email().max(120), code: z.string().regex(/^\d{6}$/) });
export async function POST(req: Request) {
  const b = await body(req, B);
  if (!b.ok) return b.res;
  if (!(await limit("auth.verify", 20, 900))) return err("rate_limited", 429);
  const s = await verifyEmailLogin(b.data.email, b.data.code);
  return s ? json({ ok: true }) : err("invalid_code", 401);
}
