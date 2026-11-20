import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { autofill } from "@/lib/server/ai";

const B = z.object({ templateSlug: z.string().max(60), answers: z.record(z.string(), z.unknown()), lang: z.enum(["en", "hi-Latn", "hi"]) });

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("ai.autofill", 30, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const v = await visitor();
  try {
    return json(await autofill(b.data.templateSlug, b.data.answers, b.data.lang, v.market));
  } catch {
    return err("unknown_template", 404);
  }
}
