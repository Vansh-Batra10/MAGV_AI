import { z } from "zod";
import { body, err, json, limit } from "@/lib/server/http";
import { getGiftBySlug, isLive } from "@/lib/server/gifts";
import { notifyBringBack } from "@/lib/server/notify";

const B = z.object({ slug: z.string().max(30) });

/** Expired free gift: recipient asks the sender to bring it back (sends the sender an upgrade link). */
export async function POST(req: Request) {
  const b = await body(req, B);
  if (!b.ok) return b.res;
  if (!(await limit(`bringback:${b.data.slug}`, 2, 86400))) return json({ ok: true });
  const g = await getGiftBySlug(b.data.slug);
  if (!g || isLive(g) !== "expired") return err("not_found", 404);
  await notifyBringBack(g);
  return json({ ok: true });
}
