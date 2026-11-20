import { z } from "zod";
import { isAdmin } from "@/lib/server/auth";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { q } from "@/lib/server/db";

const B = z.discriminatedUnion("action", [
  z.object({ action: z.literal("takedown"), id: z.string(), decision: z.enum(["remove", "restore"]) }),
  z.object({ action: z.literal("review"), id: z.string(), approve: z.boolean() }),
  z.object({ action: z.literal("flag"), slug: z.string(), enabled: z.boolean() }),
]);

export async function POST(req: Request) {
  if (!(await sameOrigin(req)) || !(await isAdmin())) return err("forbidden", 403);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const d = b.data;
  if (d.action === "takedown") {
    const t = (await q<{ gift_id: string }>(`update takedowns set status='closed' where id=$1 returning gift_id`, [d.id]))[0];
    if (t) await q(`update gifts set takedown_status=$2 where id=$1`, [t.gift_id, d.decision === "remove" ? "removed" : "none"]);
  } else if (d.action === "review") {
    if (d.approve) await q(`update reviews set approved=true where id=$1`, [d.id]);
    else await q(`delete from reviews where id=$1`, [d.id]);
  } else {
    await q(`insert into template_flags (slug, enabled) values ($1,$2) on conflict (slug) do update set enabled=excluded.enabled`, [d.slug, d.enabled]);
  }
  return json({ ok: true });
}
