"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Asset = { id: string; template: string; pack: string; slot: string; scope: string; review: string; provider: string; variants: { width: number; format: string; file: string; bytes: number }[]; checks: { name: string; ok: boolean | "manual"; detail?: string }[] };
type Overview = { assets: Asset[]; reports: { id: string; weddingId: string; reason: string; status: string; at: string }[]; orders: { id: string; tier: string; amountPaise: number; status: string; provider: string }[]; metrics: Record<string, number> };
const post = (p: string, b: unknown) => fetch(`/api/admin/${p}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());

export function Admin() {
  const [o, setO] = useState<Overview | null>(null);
  const [tab, setTab] = useState("assets");
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => { const r = await fetch("/api/admin/overview").then((x) => x.json()); if (r.ok) setO(r); }, []);
  useEffect(() => { void load(); }, [load]);
  if (!o) return <main className="st-wrap">Loading…</main>;
  return (
    <main className="st-wrap">
      <h1>Admin</h1>
      <div className="st-grid">{Object.entries(o.metrics).map(([k, v]) => <div key={k} className="st-card"><div className="muted">{k}</div><div className="st-stat">{v}</div></div>)}</div>
      <div className="st-tabs" role="tablist">{["assets", "rigging", "reports", "orders"].map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {msg && <p className="st-note">{msg}</p>}
      {tab === "assets" && <>
        <form className="st-card st-row" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setMsg("Generating…"); const r = await post("generate", { template: f.get("template"), pack: f.get("pack"), slot: f.get("slot") }); setMsg(r.ok ? "Generated, pending review" : r.error); await load(); }}>
          <label>Template<input name="template" defaultValue="sheesh-mahal" /></label><label>Pack<input name="pack" defaultValue="jaipur-dusk" /></label><label>Slot<input name="slot" defaultValue="sky" /></label>
          <button className="st-btn primary" style={{ flex: "0 0 auto" }}>Generate</button>
        </form>
        <h2>Review queue</h2>
        <div className="st-grid">{o.assets.map((a) => {
          const thumb = a.variants.find((v) => v.format === "webp") ?? a.variants[0];
          return (
            <div key={a.id} className="st-card">
              {thumb && <img alt={a.slot} src={`/api/admin/file?p=${encodeURIComponent(thumb.file)}`} style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px" }} />}
              <b>{a.template}/{a.pack}/{a.slot}</b><div className="muted">{a.scope} · {a.provider} · <span className={`st-pill ${a.review === "approved" ? "ok" : a.review === "rejected" ? "" : "warn"}`}>{a.review}</span></div>
              <ul style={{ fontSize: 13, paddingLeft: 18 }}>{a.checks.map((c) => <li key={c.name}>{c.ok === true ? "✓" : c.ok === "manual" ? "👀" : "✗"} {c.name} <span className="muted">{c.detail}</span></li>)}</ul>
              <div className="st-row">
                <button className="st-btn" onClick={async () => { const r = await post("review", { id: a.id, decision: "approved" }); setMsg(r.ok ? "Approved" : r.error); await load(); }}>Approve</button>
                <button className="st-btn" onClick={async () => { await post("review", { id: a.id, decision: "rejected" }); await load(); }}>Reject</button>
                <button className="st-btn" onClick={async () => { await post("generate", { template: a.template, pack: a.pack, slot: a.slot, seed: Math.floor(Date.now() / 1000) % 100000 }); await load(); }}>Regenerate</button>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>Send to illustrator: upload a manual file with the same slot id; it replaces this one and goes through the same checks.</p>
            </div>);
        })}</div>
      </>}
      {tab === "rigging" && <Rigger onSaved={(m) => setMsg(m)} />}
      {tab === "reports" && <div className="st-card"><table><thead><tr><th>When</th><th>Wedding</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>{o.reports.map((r) => <tr key={r.id}><td>{r.at.slice(0, 10)}</td><td>{r.weddingId}</td><td>{r.reason}</td><td>{r.status}</td><td>{r.status === "open" && <><button className="st-btn" onClick={async () => { await post("takedown", { reportId: r.id, action: "takedown" }); await load(); }}>Take down</button> <button className="st-btn ghost" onClick={async () => { await post("takedown", { reportId: r.id, action: "dismiss" }); await load(); }}>Dismiss</button></>}</td></tr>)}</tbody></table></div>}
      {tab === "orders" && <div className="st-card"><table><thead><tr><th>Order</th><th>Tier</th><th>Amount</th><th>Status</th><th>Provider</th></tr></thead><tbody>{o.orders.map((x) => <tr key={x.id}><td>{x.id}</td><td>{x.tier}</td><td>₹{(x.amountPaise / 100).toLocaleString("en-IN")}</td><td>{x.status}</td><td>{x.provider}</td></tr>)}</tbody></table></div>}
    </main>
  );
}

const PARTS = ["head", "torso", "upperArmL", "forearmL", "upperArmR", "forearmR", "legs"];
const PARENT: Record<string, string> = { head: "torso", upperArmL: "torso", forearmL: "upperArmL", upperArmR: "torso", forearmR: "upperArmR", legs: "torso" };

/** v1 puppet rigging: load a character image, lasso each part (click points), click once more with Shift for its pivot. */
function Rigger({ onSaved }: { onSaved: (m: string) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [part, setPart] = useState(PARTS[0]!);
  const [polys, setPolys] = useState<Record<string, { polygon: [number, number][]; pivot?: [number, number] }>>({});
  useEffect(() => {
    const c = cv.current; if (!c) return; const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    if (img) g.drawImage(img, 0, 0, c.width, c.height);
    for (const [id, p] of Object.entries(polys)) {
      g.strokeStyle = id === part ? "#7A2E4F" : "#1C1A22"; g.lineWidth = 2; g.beginPath();
      p.polygon.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
      if (p.pivot) { g.fillStyle = "#e11"; g.beginPath(); g.arc(p.pivot[0], p.pivot[1], 5, 0, 7); g.fill(); }
    }
  }, [img, polys, part]);
  return (
    <div className="st-card" style={{ display: "grid", gap: 10 }}>
      <input type="file" accept="image/png" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const i = new Image(); i.onload = () => setImg(i); i.src = URL.createObjectURL(f); }} />
      <div className="st-row">{PARTS.map((p) => <button key={p} className="st-btn" aria-pressed={p === part} onClick={() => setPart(p)}>{p}</button>)}</div>
      <p className="muted">Click to add polygon points for <b>{part}</b>; Shift+click sets its pivot.</p>
      <canvas ref={cv} width={400} height={600} style={{ border: "1px solid var(--ui-line)", background: "repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px", maxWidth: "100%" }}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const pt: [number, number] = [Math.round(((e.clientX - r.left) / r.width) * 400), Math.round(((e.clientY - r.top) / r.height) * 600)];
          setPolys((ps) => { const cur = ps[part] ?? { polygon: [] }; return { ...ps, [part]: e.shiftKey ? { ...cur, pivot: pt } : { ...cur, polygon: [...cur.polygon, pt] } }; }); }} />
      <div className="st-row">
        <button className="st-btn ghost" onClick={() => setPolys((ps) => { const n = { ...ps }; delete n[part]; return n; })}>Clear {part}</button>
        <button className="st-btn primary" onClick={async () => {
          const parts = Object.entries(polys).filter(([, p]) => p.polygon.length >= 3 && p.pivot).map(([id, p]) => ({ id, polygon: p.polygon, pivot: p.pivot!, parent: PARENT[id] }));
          const r = await post("rig", { name: `rig-${Date.now()}`, parts });
          onSaved(r.ok ? `Saved rig with ${parts.length} parts` : r.error ?? "Error");
        }}>Save rig JSON</button>
      </div>
    </div>
  );
}
