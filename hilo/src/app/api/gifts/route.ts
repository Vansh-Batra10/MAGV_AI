import { z } from "zod";
import { body, err, json, limit, sameOrigin, visitor } from "@/lib/server/http";
import { createDraft } from "@/lib/server/gifts";
import { getTemplate } from "@/templates/registry";
import { track } from "@/lib/server/events";

const Body = z.object({
  templateSlug: z.string().max(60),
  content: z.unknown().optional(),
  giftLanguage: z.enum(["en", "hi-Latn", "hi"]),
  createdVia: z.enum(["questions", "form"]).default("questions"),
});

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("gifts.create", 30, 3600))) return err("rate_limited", 429);
  const b = await body(req, Body);
  if (!b.ok) return b.res;
  if (!getTemplate(b.data.templateSlug)) return err("unknown_template", 404);
  const v = await visitor();
  const id = await createDraft({ ...b.data, content: b.data.content ?? null, market: v.market, bucket: v.bucket, utm: v.utm });
  await track("creator_started", { anonId: v.anonId, giftId: id, props: { template: b.data.templateSlug, via: b.data.createdVia } });
  return json({ id });
}
