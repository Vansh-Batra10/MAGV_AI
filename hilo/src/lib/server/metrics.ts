import "server-only";
import { q, one } from "./db";
import { ECONOMICS } from "@/config/pricing";

export type Range = { days: number; utm?: string | null; template?: string | null };

const since = (r: Range) => `now() - interval '${Math.max(1, Math.min(365, Math.floor(r.days)))} days'`;

export async function funnel(r: Range) {
  const where = `created_at > ${since(r)}${r.utm ? ` and props->>'utm' = $1` : ""}`;
  const p = r.utm ? [r.utm] : [];
  const count = async (name: string, extra = "") => (await one<{ n: number }>(`select count(distinct coalesce(anon_id, gift_id, id))::int as n from events where name='${name}' and ${where} ${extra}`, p))?.n ?? 0;
  const tplFilter = r.template ? ` and (props->>'template' = '${r.template.replace(/'/g, "")}')` : "";
  const steps = [
    { key: "landing_view", n: await count("landing_view") },
    { key: "template_view", n: await count("template_view", tplFilter) },
    { key: "preview_shown", n: await count("preview_shown", tplFilter) },
    { key: "checkout_started", n: await count("checkout_started") },
    { key: "payment_success", n: await count("payment_success", tplFilter) },
  ];
  const ttp = await one<{ p50: number | null }>(`select percentile_cont(0.5) within group (order by (props->>'time_to_first_preview_ms')::float) as p50 from events where name='preview_shown' and ${where}`, p);
  const drop = await q<{ step: string; n: number }>(`select props->>'step' as step, count(*)::int as n from events where name='question_step' and ${where} ${tplFilter} group by 1 order by 2 desc`, p);
  return { steps, medianTimeToPreviewMs: ttp?.p50 ?? null, questionSteps: drop };
}

export async function virality(r: Range) {
  const sent = (await one<{ n: number }>(`select count(*)::int as n from gifts where slug is not null and paid_at > ${since(r)}`))?.n ?? 0;
  const viral = (await one<{ n: number }>(`select count(distinct anon_id)::int as n from events where name='creator_started' and created_at > ${since(r)} and anon_id in (select anon_id from events where name in ('gift_opened','contributor_submitted','recipient_clicked_make_own','contributor_clicked_make_own') and anon_id is not null)`))?.n ?? 0;
  const free = (await one<{ n: number }>(`select count(*)::int as n from gifts where tier='free' and created_at > ${since(r)} and slug is not null`))?.n ?? 0;
  const up = await q<{ payer: string; n: number }>(`select payer, count(*)::int as n from orders where purpose='upgrade' and status='paid' and created_at > ${since(r)} group by payer`);
  const group = await one<{ gifts: number; paid: number; avg: number | null }>(`select count(*)::int as gifts, count(paid_at)::int as paid, (select avg(c)::float from (select count(*) c from group_contributions gc join gifts g2 on g2.id=gc.gift_id where g2.created_at > ${since(r)} group by gc.gift_id) x) as avg from gifts where mode='group' and created_at > ${since(r)}`);
  const repeat = await one<{ buyers: number; repeaters: number }>(`select count(*)::int as buyers, count(*) filter (where n > 1)::int as repeaters from (select lower(buyer_email) e, count(*) n from orders where status='paid' and created_at > now() - interval '90 days' and buyer_email is not null group by 1) x`);
  return { sent, viralCreators: viral, k: sent ? viral / sent : 0, freeSent: free, upgrades: up, group, repeat };
}

export async function economics(r: Range) {
  const rows = await q<{ currency: string; purpose: string; n: number; gross: number }>(`select currency, purpose, count(*)::int as n, coalesce(sum(amount_minor),0)::int as gross from orders where status='paid' and created_at > ${since(r)} group by 1,2`);
  const msgs = await one<{ cost: number }>(`select coalesce(sum(est_cost_minor),0)::int as cost from outbox where created_at > ${since(r)}`);
  const byCur: Record<string, { orders: number; gross: number; gst: number; fees: number; net: number }> = {};
  for (const x of rows) {
    const c = (byCur[x.currency] ??= { orders: 0, gross: 0, gst: 0, fees: 0, net: 0 });
    c.orders += x.n;
    c.gross += x.gross;
    const gst = x.currency === "INR" ? Math.round(x.gross - x.gross / (1 + ECONOMICS.gstRate)) : 0;
    const feePct = x.currency === "INR" ? ECONOMICS.gatewayDomesticPct : ECONOMICS.gatewayInternationalPct;
    const fees = Math.round(x.gross * feePct * (1 + ECONOMICS.gstOnFee));
    c.gst += gst;
    c.fees += fees;
  }
  const totalOrders = Object.values(byCur).reduce((s, c) => s + c.orders, 0) || 1;
  for (const [cur, c] of Object.entries(byCur)) {
    const msgShare = Math.round(((msgs?.cost ?? 0) * c.orders) / totalOrders);
    c.net = c.gross - c.gst - c.fees - (cur === "INR" ? msgShare : Math.round(msgShare / ECONOMICS.usdToInr));
  }
  const daily = await q<{ d: string; currency: string; gross: number }>(`select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') d, currency, sum(amount_minor)::int gross from orders where status='paid' and created_at > ${since(r)} group by 1,2 order by 1`);
  return { byCurrency: byCur, messagingCostPaise: msgs?.cost ?? 0, daily };
}
