import { z } from "zod";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { one, q } from "@/lib/server/db";
import { getEditableGift } from "@/lib/server/gifts";
import { clean } from "@/lib/server/moderation";

async function owned(id: string) {
  const c = await one<{ gift_id: string }>(`select gift_id from group_contributions where id=$1`, [id]);
  if (!c) return null;
  return getEditableGift(c.gift_id);
}

const P = z.object({ hidden: z.boolean().optional(), message: z.string().max(500).optional(), name: z.string().max(40).optional() });

/** Organiser moderation: hide / edit / delete a contribution. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const { id } = await params;
  if (!(await owned(id))) return err("not_found", 404);
  const b = await body(req, P);
  if (!b.ok) return b.res;
  if (b.data.hidden !== undefined) await q(`update group_contributions set hidden=$2 where id=$1`, [id, b.data.hidden]);
  if (b.data.message !== undefined) await q(`update group_contributions set message=$2 where id=$1`, [id, clean(b.data.message, 500)]);
  if (b.data.name !== undefined) await q(`update group_contributions set name=$2 where id=$1`, [id, clean(b.data.name, 40)]);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const { id } = await params;
  if (!(await owned(id))) return err("not_found", 404);
  await q(`delete from group_contributions where id=$1`, [id]);
  return json({ ok: true });
}
