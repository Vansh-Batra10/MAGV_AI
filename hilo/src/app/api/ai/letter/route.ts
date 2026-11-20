import { z } from "zod";
import { body, err, json, limit, sameOrigin } from "@/lib/server/http";
import { writeLetter } from "@/lib/server/ai";

const B = z.object({ feelings: z.string().min(3).max(2000), tone: z.enum(["sweet", "filmy", "poetic", "funny"]), lang: z.enum(["en", "hi-Latn", "hi"]), to: z.string().max(40), from: z.string().max(40) });

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("ai.letter", 20, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const r = await writeLetter(b.data);
  return r.letter ? json(r) : err(r.error ?? "failed", 422);
}
