"use client";
import { useRouter } from "next/navigation";

export function AdminActions({ takedowns, reviews, flags }: { takedowns: { id: string; gift_id: string; kind: string; reason: string | null }[]; reviews: { id: string; name: string; text: string; rating: number }[]; flags: { slug: string; enabled: boolean }[] }) {
  const router = useRouter();
  const act = async (body: object) => {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  };
  const b = "h-8 rounded-full bg-white/10 px-3 text-xs text-hi";
  return (
    <div className="mt-3 flex flex-col gap-5 text-sm">
      <div>
        <p className="text-lo">Takedowns & reports ({takedowns.length})</p>
        {takedowns.map((t) => (
          <div key={t.id} className="mt-2 flex items-center gap-2 rounded-xl bg-white/[0.03] p-2">
            <span className="flex-1 text-mid">{t.kind} · {t.gift_id} · {t.reason ?? "—"}</span>
            <button className={b} onClick={() => act({ action: "takedown", id: t.id, decision: "remove" })}>Remove</button>
            <button className={b} onClick={() => act({ action: "takedown", id: t.id, decision: "restore" })}>Restore</button>
          </div>
        ))}
      </div>
      <div>
        <p className="text-lo">Reviews pending ({reviews.length})</p>
        {reviews.map((r) => (
          <div key={r.id} className="mt-2 flex items-center gap-2 rounded-xl bg-white/[0.03] p-2">
            <span className="flex-1 text-mid">{"★".repeat(r.rating)} {r.name}: {r.text}</span>
            <button className={b} onClick={() => act({ action: "review", id: r.id, approve: true })}>Approve</button>
            <button className={b} onClick={() => act({ action: "review", id: r.id, approve: false })}>Delete</button>
          </div>
        ))}
      </div>
      <div>
        <p className="text-lo">Templates</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {flags.map((f) => <button key={f.slug} className={`${b} ${f.enabled ? "" : "opacity-40 line-through"}`} onClick={() => act({ action: "flag", slug: f.slug, enabled: !f.enabled })}>{f.slug}</button>)}
        </div>
      </div>
    </div>
  );
}
