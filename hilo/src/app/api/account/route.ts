import { getSession, clearSession } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { err, json, sameOrigin } from "@/lib/server/http";
import { storage } from "@/lib/server/adapters/storage";

/** Self-serve account deletion (DPDP / GDPR): gifts, media, replies, reactions, reminders, profile. */
export async function DELETE(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  const s = await getSession();
  if (!s) return err("unauthorized", 401);
  const gifts = await q<{ id: string; content: any }>(`select id, content from gifts where owner_id=$1`, [s.uid]);
  for (const g of gifts) {
    const keys = JSON.stringify(g.content ?? {}).match(/\/api\/media\/([a-z]+\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4})/g) ?? [];
    for (const k of keys) await storage.remove(k.replace("/api/media/", ""));
    for (const r of await q<{ storage_key: string }>(`select storage_key from reactions where gift_id=$1`, [g.id])) await storage.remove(r.storage_key);
    await q(`delete from gifts where id=$1`, [g.id]);
  }
  await q(`delete from reminders where user_id=$1`, [s.uid]);
  await q(`update orders set user_id=null, buyer_email=null, buyer_phone=null where user_id=$1`, [s.uid]); // keep tax records, drop identity
  await q(`delete from profiles where id=$1`, [s.uid]);
  await clearSession();
  return json({ ok: true });
}
