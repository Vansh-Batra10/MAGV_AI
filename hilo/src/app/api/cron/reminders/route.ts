import { q } from "@/lib/server/db";
import { cronAuthorized } from "@/lib/server/cron";
import { send, pickChannel } from "@/lib/server/adapters/messaging";
import { now } from "@/lib/server/env";
import { SITE_URL } from "@/config/brand";
import { suggestedTemplate } from "@/lib/reminders";

/** Daily 09:00 IST: reminders 7 days and 1 day before saved dates (email by default; WhatsApp only with opt-in). */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("unauthorized", { status: 401 });
  const t = now();
  const rows = await q<{ id: string; person_name: string; relation: string | null; occasion: string; month: number; day: number; channel: string; last_sent_for_year: number | null; last_sent_kind: string | null; email: string; phone: string | null; market: "IN" | "GLOBAL" }>(
    `select r.*, p.email, p.phone, p.market from reminders r join profiles p on p.id=r.user_id`);
  let sent = 0;
  for (const r of rows) {
    let target = new Date(Date.UTC(t.getUTCFullYear(), r.month - 1, r.day));
    if (target.getTime() < Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) target = new Date(Date.UTC(t.getUTCFullYear() + 1, r.month - 1, r.day));
    const days = Math.round((target.getTime() - Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) / 86400000);
    const kind = days === 7 ? "d7" : days === 1 ? "d1" : null;
    if (!kind) continue;
    const year = target.getUTCFullYear();
    if (r.last_sent_for_year === year && (r.last_sent_kind === kind || r.last_sent_kind === "d1")) continue;
    const ch = pickChannel({ email: r.email, phone: r.phone, whatsappOptIn: r.channel === "whatsapp" }, r.market, "marketing");
    if (!ch) continue;
    const tpl = suggestedTemplate(r.occasion);
    const link = `${SITE_URL}/create/${tpl}?name=${encodeURIComponent(r.person_name)}`;
    await send({ ...ch, template: "reminder", category: "marketing", subject: `${r.person_name}'s ${r.occasion} is in ${days} day${days > 1 ? "s" : ""}`, text: `${r.person_name}'s ${r.occasion} is in ${days} day${days > 1 ? "s" : ""}. We drafted something for you: ${link}` });
    await q(`update reminders set last_sent_for_year=$2, last_sent_kind=$3 where id=$1`, [r.id, year, kind]);
    sent++;
  }
  return Response.json({ sent });
}
