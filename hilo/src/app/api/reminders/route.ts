import { z } from "zod";
import { body, err, json, sameOrigin } from "@/lib/server/http";
import { getSession } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { newId } from "@/lib/ids";

const B = z.object({ personName: z.string().min(1).max(40), relation: z.string().max(20).optional(), occasion: z.string().max(30), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31), year: z.number().int().optional(), channel: z.enum(["email", "whatsapp", "sms"]).default("email") });

export async function GET() {
  const s = await getSession();
  if (!s) return err("unauthorized", 401);
  return json({ reminders: await q(`select * from reminders where user_id=$1 order by month, day`, [s.uid]) });
}

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const s = await getSession();
  if (!s) return err("unauthorized", 401);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const d = b.data;
  const id = newId();
  await q(`insert into reminders (id, user_id, person_name, relation, occasion, month, day, year, channel) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, s.uid, d.personName, d.relation ?? null, d.occasion, d.month, d.day, d.year ?? null, d.channel]);
  return json({ id });
}

export async function DELETE(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const s = await getSession();
  if (!s) return err("unauthorized", 401);
  const id = new URL(req.url).searchParams.get("id");
  await q(`delete from reminders where id=$1 and user_id=$2`, [id, s.uid]);
  return json({ ok: true });
}
