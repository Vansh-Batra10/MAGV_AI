import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioHome() {
  const u = await currentUser();
  if (!u) redirect("/login?next=/studio");
  const ws = store().weddingsFor(u.id);
  return (
    <main className="st-wrap">
      <h1>Your invites</h1>
      <p className="muted">Create, preview, send and track.</p>
      <div className="st-grid" style={{ marginTop: 16 }}>
        <Link className="st-card" href="/studio/new" style={{ textDecoration: "none", display: "grid", placeItems: "center", minHeight: 120, borderStyle: "dashed" }}><b>+ Create your invite</b></Link>
        {ws.map((w) => (
          <Link key={w.id} className="st-card" href={`/studio/${w.id}`} style={{ textDecoration: "none" }}>
            <b>{w.content.bride.name} &amp; {w.content.groom.name}</b>
            <p className="muted" style={{ margin: "4px 0" }}>{w.templateId} · {w.packId}</p>
            <span className={`st-pill ${w.status === "published" ? "ok" : ""}`}>{w.status}</span> <span className="st-pill">{w.tier}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
