import Link from "next/link";
import { requireAdmin } from "@/lib/server/admin";
import { funnel, virality, economics } from "@/lib/server/metrics";
import { q } from "@/lib/server/db";
import { MOCK } from "@/lib/server/env";
import { formatMoney } from "@/config/pricing";
import { TEMPLATES } from "@/templates/registry";
import { OCCASIONS } from "@/config/occasions";
import { AppChrome } from "@/components/layout/AppChrome";
import { AdminActions } from "@/components/admin/AdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const card = "glass p-5";
const LABEL: Record<string, string> = { landing_view: "Landing", template_view: "Template view", preview_shown: "First preview", checkout_started: "Checkout", payment_success: "Paid" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ days?: string; utm?: string; template?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const range = { days: Number(sp.days ?? 7), utm: sp.utm ?? null, template: sp.template ?? null };
  const [f, v, e] = await Promise.all([funnel(range), virality(range), economics(range)]);
  const orders = await q<{ id: string; created_at: string; currency: "INR" | "USD"; amount_minor: number; status: string; tier: string; duration: string; purpose: string; payer: string; experiment_bucket: string | null; utm: any }>(`select * from orders order by created_at desc limit 25`);
  const takedowns = await q<{ id: string; gift_id: string; kind: string; reason: string | null; status: string; created_at: string }>(`select * from takedowns where status='open' order by created_at desc limit 50`);
  const flags = await q<{ slug: string; enabled: boolean }>(`select slug, enabled from template_flags`);
  const reviews = await q<{ id: string; name: string; text: string; rating: number; approved: boolean }>(`select * from reviews where approved=false order by created_at desc limit 20`);
  const unverified = OCCASIONS.filter((o) => o.dateRule.kind === "explicit" && o.dateRule.verify?.length);
  const max = Math.max(1, ...f.steps.map((s) => s.n));
  return (
    <AppChrome right={<><Link href="/admin/outbox" className="hover:text-hi">Outbox</Link><Link href="/brand" className="hover:text-hi">Brand</Link></>}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[48px] text-hi">Admin</h1>
          <form className="flex flex-wrap gap-2 text-sm">
            <select name="days" defaultValue={String(range.days)} className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-hi">{[1, 7, 30, 90].map((d) => <option key={d} value={d} className="bg-ink-900">{d}d</option>)}</select>
            <input name="utm" defaultValue={range.utm ?? ""} placeholder="utm_source" className="h-10 w-32 rounded-full border border-white/10 bg-white/5 px-3 text-hi" />
            <select name="template" defaultValue={range.template ?? ""} className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-hi"><option value="" className="bg-ink-900">All templates</option>{TEMPLATES.map((t) => <option key={t.meta.slug} value={t.meta.slug} className="bg-ink-900">{t.meta.slug}</option>)}</select>
            <button className="h-10 rounded-full bg-white/10 px-4 text-hi">Apply</button>
          </form>
        </div>
        {(MOCK.payments || MOCK.db) && <p className="mt-3 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-300">MOCK mode: {Object.entries(MOCK).filter(([, x]) => x).map(([k]) => k).join(", ")} are simulated.</p>}
        {unverified.length > 0 && <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">TODO_VERIFY_DATE: {unverified.map((o) => `${o.slug} (${(o.dateRule as { verify?: number[] }).verify?.join(", ")})`).join(" · ")} — confirm festival dates before campaigns.</p>}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className={`${card} lg:col-span-2`}>
            <h2 className="font-display text-[26px] text-hi">Funnel</h2>
            <div className="mt-4 flex flex-col gap-2">
              {f.steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-mid">{LABEL[s.key]}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/5"><div className="h-full rounded-lg [background:var(--grad-kiss)]" style={{ width: `${(s.n / max) * 100}%` }} /></div>
                  <span className="w-28 shrink-0 text-right tabular-nums text-hi">{s.n}{i > 0 && f.steps[i - 1].n ? <span className="text-lo"> · {Math.round((s.n / f.steps[i - 1].n) * 100)}%</span> : null}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-mid">Median time to first preview: <b className="text-hi">{f.medianTimeToPreviewMs ? `${Math.round(f.medianTimeToPreviewMs / 1000)}s` : "—"}</b> (target &lt; 90s)</p>
            {f.questionSteps.length > 0 && <p className="mt-2 text-xs text-lo">Question steps reached: {f.questionSteps.map((s) => `${s.step}: ${s.n}`).join(" · ")}</p>}
          </section>
          <section className={card}>
            <h2 className="font-display text-[26px] text-hi">Growth</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat k="Viral k" v={v.k.toFixed(2)} hint="target ≥ 0.3" />
              <Stat k="Gifts sent" v={v.sent} />
              <Stat k="Free sent" v={v.freeSent} />
              <Stat k="Free→forever" v={v.upgrades.map((u) => `${u.payer}: ${u.n}`).join(", ") || "0"} />
              <Stat k="Group gifts" v={`${v.group?.gifts ?? 0} (${v.group?.paid ?? 0} paid)`} />
              <Stat k="Contrib / group" v={v.group?.avg ? v.group.avg.toFixed(1) : "—"} />
              <Stat k="Repeat 90d" v={v.repeat?.buyers ? `${Math.round((v.repeat.repeaters / v.repeat.buyers) * 100)}%` : "—"} />
            </dl>
          </section>
        </div>

        <section className={`${card} mt-4`}>
          <h2 className="font-display text-[26px] text-hi">Unit economics & revenue</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {Object.entries(e.byCurrency).map(([cur, c]) => (
              <div key={cur} className="rounded-2xl bg-white/[0.03] p-4 text-sm">
                <p className="font-semibold text-hi">{cur} · {c.orders} orders</p>
                <p className="mt-2 text-mid">Gross {formatMoney(c.gross, cur as "INR")} − GST {formatMoney(c.gst, cur as "INR")} − gateway {formatMoney(c.fees, cur as "INR")} − messaging = <b className="text-hi">{formatMoney(c.net, cur as "INR")}</b></p>
                <p className="mt-1 text-lo">Contribution / order: {formatMoney(Math.round(c.net / Math.max(1, c.orders)), cur as "INR")}</p>
              </div>
            ))}
            {Object.keys(e.byCurrency).length === 0 && <p className="text-mid">No paid orders in range.</p>}
          </div>
          {e.daily.length > 0 && (
            <div className="mt-4 flex h-28 items-end gap-1" aria-label="Daily revenue">
              {e.daily.map((d) => <div key={d.d + d.currency} title={`${d.d} ${d.currency} ${d.gross / 100}`} className="flex-1 rounded-t bg-rose-500/70" style={{ height: `${(d.gross / Math.max(...e.daily.map((x) => x.gross))) * 100}%` }} />)}
            </div>
          )}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className={card}>
            <h2 className="font-display text-[26px] text-hi">Recent orders</h2>
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-lo"><tr><th className="py-1">When</th><th>Amount</th><th>Tier</th><th>Status</th><th>Src</th><th>AB</th></tr></thead>
              <tbody>{orders.map((o) => <tr key={o.id} className="border-t border-white/5 text-mid"><td className="py-1.5">{new Date(o.created_at).toISOString().slice(5, 16).replace("T", " ")}</td><td className="text-hi">{formatMoney(o.amount_minor, o.currency)}</td><td>{o.tier}/{o.duration}{o.purpose === "upgrade" ? ` ↑${o.payer}` : ""}</td><td>{o.status}</td><td>{o.utm?.utm_source ?? "—"}</td><td>{o.experiment_bucket ?? "—"}</td></tr>)}</tbody>
            </table>
          </section>
          <section className={card}>
            <h2 className="font-display text-[26px] text-hi">Moderation</h2>
            <AdminActions takedowns={takedowns} reviews={reviews} flags={TEMPLATES.map((t) => ({ slug: t.meta.slug, enabled: flags.find((f) => f.slug === t.meta.slug)?.enabled ?? true }))} />
          </section>
        </div>
      </div>
    </AppChrome>
  );
}

function Stat({ k, v, hint }: { k: string; v: string | number; hint?: string }) {
  return <div className="rounded-2xl bg-white/[0.03] p-3"><dt className="text-lo">{k}</dt><dd className="mt-1 text-lg font-semibold text-hi">{v}</dd>{hint && <p className="text-[10px] text-lo">{hint}</p>}</div>;
}
