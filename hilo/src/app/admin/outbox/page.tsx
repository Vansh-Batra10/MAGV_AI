import { requireAdmin } from "@/lib/server/admin";
import { q } from "@/lib/server/db";
import { AppChrome } from "@/components/layout/AppChrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbox", robots: { index: false } };

/** Every outbound message (MOCK or real) with category and estimated cost. */
export default async function Outbox() {
  await requireAdmin({ devOpen: true });
  const rows = await q<{ id: string; channel: string; to: string; template: string; payload: any; status: string; category: string; est_cost_minor: number; created_at: string }>(`select * from outbox order by created_at desc limit 200`);
  return (
    <AppChrome>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[44px] text-hi">Outbox</h1>
        <ul className="mt-6 flex flex-col gap-3" data-testid="outbox">
          {rows.map((r) => (
            <li key={r.id} className="glass p-4 text-sm">
              <p className="text-lo">{new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)} · <b className="text-hi">{r.channel}</b> → {r.to} · {r.template} · {r.category} · {r.status} · est {r.est_cost_minor}p</p>
              {r.payload?.subject && <p className="mt-1 font-semibold text-hi">{r.payload.subject}</p>}
              <p className="mt-1 whitespace-pre-line text-mid">{r.payload?.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </AppChrome>
  );
}
