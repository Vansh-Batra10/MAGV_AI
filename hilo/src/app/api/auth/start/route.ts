import { z } from "zod";
import { body, err, json, limit } from "@/lib/server/http";
import { startEmailLogin } from "@/lib/server/auth";

const B = z.object({ email: z.string().email().max(120), lang: z.string().max(10).optional() });
export async function POST(req: Request) {
  const b = await body(req, B);
  if (!b.ok) return b.res;
  if (!(await limit(`auth:${b.data.email}`, 5, 900))) return err("rate_limited", 429);
  return json(await startEmailLogin(b.data.email, b.data.lang ?? "en"));
}
