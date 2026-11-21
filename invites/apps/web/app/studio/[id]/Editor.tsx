"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DbGuest, DbPledge, DbRsvp, DbWedding } from "@invites/db";
import { tiers, formatINR, type Entitlements } from "@invites/config";
import { inviteMessage, smsLink, waLink } from "@/lib/messages";
import type { dashboard } from "@/lib/dashboard";

type Summary = { wedding: DbWedding; guests: DbGuest[]; rsvps: DbRsvp[]; pledges: DbPledge[]; extras: { songs: { text: string; guestId: string }[]; blessings: { blessing: string; guestId: string; signatureSvg?: string }[]; votes: { ladkewale: number; ladkiwale: number } }; dashboard: ReturnType<typeof dashboard>; entitlements: Entitlements; appUrl: string };
const TABS = ["preview", "details", "guests", "send", "dashboard", "shagun", "plan", "exports"] as const;
type Tab = (typeof TABS)[number];

async function api(id: string, path: string, method = "GET", body?: unknown) {
  const r = await fetch(`/api/studio/weddings/${id}/${path}`, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  return r.json();
}

export function Editor({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>("preview");
  const [s, setS] = useState<Summary | null>(null);
  const [msg, setMsg] = useState("");
  const reload = useCallback(async () => { const r = await api(id, "summary"); if (r.ok) setS(r); }, [id]);
  useEffect(() => { const q = new URLSearchParams(location.search).get("tab") as Tab | null; if (q && TABS.includes(q)) setTab(q); void reload(); }, [reload]);
  useEffect(() => { if (s) try { localStorage.setItem(`inv:w:${id}`, JSON.stringify(s.wedding.content)); } catch { /* ignore */ } }, [s, id]);
  if (!s) return <main className="st-wrap"><p className="muted">Loading…</p></main>;
  const w = s.wedding;
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  return (
    <main className="st-wrap">
      <div className="st-row" style={{ alignItems: "center" }}>
        <div style={{ flex: "1 1 auto" }}><h1>{w.content.bride.name} &amp; {w.content.groom.name}</h1><span className={`st-pill ${w.status === "published" ? "ok" : ""}`}>{w.status}</span> <span className="st-pill">{tiers[w.tier].name}</span></div>
        {w.status !== "published" && <button className="st-btn primary" style={{ flex: "0 0 auto" }} onClick={async () => { await api(id, "publish", "POST"); await reload(); flash("Published"); }}>Publish</button>}
      </div>
      {msg && <p className="st-note" role="status">{msg}</p>}
      <div className="st-tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>)}</div>
      {tab === "preview" && <PreviewTab id={id} s={s} />}
      {tab === "details" && <DetailsTab id={id} s={s} reload={reload} flash={flash} />}
      {tab === "guests" && <GuestsTab id={id} s={s} reload={reload} flash={flash} />}
      {tab === "send" && <SendTab id={id} s={s} reload={reload} />}
      {tab === "dashboard" && <DashboardTab s={s} />}
      {tab === "shagun" && <ShagunTab id={id} s={s} reload={reload} flash={flash} />}
      {tab === "plan" && <PlanTab id={id} s={s} reload={reload} flash={flash} />}
      {tab === "exports" && <ExportsTab id={id} s={s} />}
    </main>
  );
}

function PreviewTab({ id, s }: { id: string; s: Summary }) {
  const [as, setAs] = useState<string>("");
  const g = s.guests.find((x) => x.id === as);
  const src = g ? `/${s.wedding.inviteCode}/${g.guestCode}` : `/studio/preview?key=inv:w:${id}&template=${s.wedding.templateId}&pack=${s.wedding.packId}`;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ maxWidth: 360 }}>Preview as<select value={as} onChange={(e) => setAs(e.target.value)}><option value="">You (sample guest)</option>{s.guests.map((x) => <option key={x.id} value={x.id}>{x.salutation}</option>)}</select></label>
      <div className="st-phone" style={{ maxWidth: 360 }}><iframe title="Invite preview" key={src} src={src} /></div>
      {s.entitlements.watermark && <p className="muted">Preview shows a watermark until you choose a plan.</p>}
    </div>
  );
}

function DetailsTab({ id, s, reload, flash }: { id: string; s: Summary; reload: () => Promise<void>; flash: (m: string) => void }) {
  const [json, setJson] = useState(() => JSON.stringify(s.wedding.content, null, 2));
  const [ev, setEv] = useState(s.wedding.content.events);
  const [update, setUpdate] = useState("");
  const [err, setErr] = useState("");
  const save = async (content: unknown) => { setErr(""); const r = await api(id, "wedding", "PATCH", { content }); if (!r.ok) setErr(r.error); else { await reload(); flash("Saved. Guests see changes on their next visit."); } };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="st-card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Functions</h2>
        {ev.map((e, i) => (
          <div key={e.id} className="st-row">
            <label>{e.titleEn}<input type="datetime-local" value={e.startsAt.slice(0, 16)} onChange={(x) => setEv(ev.map((y, j) => (j === i ? { ...y, startsAt: `${x.target.value}:00+05:30` } : y)))} /></label>
            <label>Venue<input value={e.venueName} onChange={(x) => setEv(ev.map((y, j) => (j === i ? { ...y, venueName: x.target.value } : y)))} /></label>
            <label>Dress code (e.g. Peela #F4C430)<input defaultValue={e.dressCode.map((d) => `${d.name} ${d.hex}`).join(", ")} onBlur={(x) => setEv(ev.map((y, j) => (j === i ? { ...y, dressCode: x.target.value.split(",").map((p) => p.trim().match(/^(.+?)\s+(#[0-9a-fA-F]{6})$/)).filter(Boolean).map((m) => ({ name: m![1]!, hex: m![2]! })) } : y)))} /></label>
          </div>
        ))}
        <button className="st-btn primary" style={{ justifySelf: "start" }} onClick={() => save({ ...s.wedding.content, events: ev })}>Save functions</button>
      </div>
      <div className="st-card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Live update</h2>
        <p className="muted" style={{ margin: 0 }}>Guests who already opened the invite see this banner on their next visit.</p>
        <div className="st-row"><input value={update} onChange={(e) => setUpdate(e.target.value)} maxLength={160} placeholder="Sangeet ka venue badal gaya hai" /><button className="st-btn" style={{ flex: "0 0 auto" }} onClick={async () => { await api(id, "updates", "POST", { message: update }); setUpdate(""); await reload(); flash("Update posted"); }}>Post</button></div>
      </div>
      <details className="st-card"><summary><b>Everything else (advanced)</b></summary>
        <p className="muted">Wording, story, FAQ, stay details. Validated before saving.</p>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} style={{ minHeight: 360, fontFamily: "ui-monospace,monospace", fontSize: 13 }} />
        <button className="st-btn primary" onClick={() => { try { void save(JSON.parse(json)); } catch { setErr("That isn't valid JSON"); } }}>Save</button>
      </details>
      {err && <p className="st-err">{err}</p>}
    </div>
  );
}

function GuestsTab({ id, s, reload, flash }: { id: string; s: Summary; reload: () => Promise<void>; flash: (m: string) => void }) {
  const [paste, setPaste] = useState("");
  const [group, setGroup] = useState(s.wedding.groups[0]?.id ?? "");
  const [csv, setCsv] = useState<string | null>(null);
  const [map, setMap] = useState({ name: 0, phone: 1 });
  const w = s.wedding;
  const addPaste = async () => {
    const rows = paste.split(/\r?\n/).filter((l) => l.trim());
    const r = await api(id, "guests", "POST", { paste: rows.join("\n") });
    if (group && r.ok) { const fresh = await api(id, "summary"); const newOnes = (fresh.guests as DbGuest[]).slice(-r.added); await Promise.all(newOnes.map((g) => api(id, `guests/${g.id}`, "PATCH", { groupId: group }))); }
    setPaste(""); await reload(); flash(r.ok ? `Added ${r.added}${r.skipped ? `, ${r.skipped} duplicates skipped` : ""}` : r.error);
  };
  const toggle = async (g: DbGuest, ev: string) => {
    const has = g.invitedEventIds.includes(ev);
    const next = has ? g.invitedEventIds.filter((x) => x !== ev) : [...g.invitedEventIds, ev];
    if (!next.length) return;
    await api(id, `guests/${g.id}`, "PATCH", { invitedEventIds: next }); await reload();
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="st-card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Add guests</h2>
        <label>Paste a list: one per line, &quot;Name, phone&quot;<textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Sharma Parivar, 98100 12345\nMehta Uncle & Aunty, +91 98111 22222\nRiya, 9876543210"} /></label>
        <div className="st-row">
          <label>Group<select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">No group</option>{w.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          <button className="st-btn primary" style={{ flex: "0 0 auto" }} disabled={!paste.trim()} onClick={addPaste}>Add</button>
        </div>
        <label>Or upload a CSV<input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} /></label>
        {csv && <div className="st-row">
          <label>Name column #<input type="number" min={0} value={map.name} onChange={(e) => setMap({ ...map, name: Number(e.target.value) })} /></label>
          <label>Phone column #<input type="number" min={0} value={map.phone} onChange={(e) => setMap({ ...map, phone: Number(e.target.value) })} /></label>
          <button className="st-btn primary" style={{ flex: "0 0 auto" }} onClick={async () => { const r = await api(id, "guests", "POST", { csv, mapping: { ...map, header: true } }); setCsv(null); await reload(); flash(r.ok ? `Imported ${r.added}` : r.error); }}>Import</button>
        </div>}
        <p className="muted" style={{ margin: 0 }}>Duplicates are merged by phone number. On {tiers[w.tier].name}, up to {s.entitlements.maxGuestLinks ?? "unlimited"} personal links.</p>
      </div>
      <div className="st-card" style={{ overflowX: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Invitation matrix</h2>
        <table className="st-matrix"><thead><tr><th>Guest</th>{w.content.events.map((e) => <th key={e.id}>{e.titleEn}</th>)}<th>Shagun</th><th>Language</th><th></th></tr></thead>
          <tbody>{s.guests.map((g) => (
            <tr key={g.id}>
              <td><b>{g.salutation}</b><br /><span className="muted">{w.groups.find((x) => x.id === g.groupId)?.name ?? ""} {g.phone ?? ""}</span></td>
              {w.content.events.map((e) => <td key={e.id}><input type="checkbox" aria-label={`${g.salutation} invited to ${e.titleEn}`} style={{ width: 20, minHeight: 20 }} checked={g.invitedEventIds.includes(e.id)} onChange={() => toggle(g, e.id)} /></td>)}
              <td><input type="checkbox" aria-label={`Show shagun to ${g.salutation}`} style={{ width: 20, minHeight: 20 }} checked={g.shagunVisible} onChange={async () => { await api(id, `guests/${g.id}`, "PATCH", { shagunVisible: !g.shagunVisible }); await reload(); }} /></td>
              <td><select value={`${g.locale}:${g.tone}`} onChange={async (e) => { const [locale, tone] = e.target.value.split(":"); await api(id, `guests/${g.id}`, "PATCH", { locale, tone }); await reload(); }} style={{ minWidth: 140 }}>
                {["hi:formal", "hinglish:formal", "hinglish:warm", "hinglish:playful", "en:formal", "en:warm", "en:playful"].map((v) => <option key={v} value={v}>{v.replace(":", " · ")}</option>)}</select></td>
              <td><button className="st-btn ghost" aria-label={`Remove ${g.salutation}`} onClick={async () => { if (confirm(`Remove ${g.salutation}?`)) { await api(id, `guests/${g.id}`, "DELETE"); await reload(); } }}>×</button></td>
            </tr>))}</tbody></table>
      </div>
    </div>
  );
}

function SendTab({ id, s, reload }: { id: string; s: Summary; reload: () => Promise<void> }) {
  const w = s.wedding;
  const queue = useMemo(() => s.guests.filter((g) => !g.sentAt), [s.guests]);
  const [i, setI] = useState(0);
  const g = queue[Math.min(i, queue.length - 1)];
  if (!s.entitlements.canSend) return <div className="st-card"><p>Sending personal links needs a plan. <b>Preview</b> lets you see everything first.</p></div>;
  if (w.status !== "published") return <div className="st-card"><p>Publish the invite first.</p></div>;
  if (!g) return <div className="st-card"><p>Everyone has been sent their invite. 🎉</p></div>;
  const link = `${s.appUrl}/${w.inviteCode}/${g.guestCode}`;
  const names = `${w.content.bride.name} & ${w.content.groom.name}`;
  const text = inviteMessage({ locale: g.locale, tone: g.tone, salutation: g.salutation, names, link });
  const done = async () => { await api(id, `sent/${g.id}`, "POST"); await reload(); setI(0); };
  return (
    <div className="st-card" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <p className="muted" style={{ margin: 0 }}>{queue.length} left to send</p>
      <h2 style={{ margin: 0 }}>{g.salutation}</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f2ea", padding: 12, borderRadius: 10, margin: 0, fontFamily: "inherit" }}>{text}</pre>
      <div className="st-row">
        <a className="st-btn primary" href={waLink(g.phone, text)} target="_blank" rel="noopener" onClick={() => setTimeout(done, 400)} data-testid="wa-send">Send on WhatsApp</a>
        <a className="st-btn" href={smsLink(g.phone, text)} onClick={() => setTimeout(done, 400)}>SMS</a>
        <button className="st-btn" onClick={async () => { await navigator.clipboard?.writeText(link); }}>Copy link</button>
        <button className="st-btn ghost" onClick={() => setI(i + 1)}>Skip</button>
      </div>
      <button className="st-btn ghost" style={{ justifySelf: "start" }} onClick={done}>Mark as sent</button>
    </div>
  );
}

function DashboardTab({ s }: { s: Summary }) {
  const d = s.dashboard;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="st-grid">{([["Guests", d.totals.guests], ["Sent", d.totals.sent], ["Opened", d.totals.opened], ["Replied", d.totals.replied]] as const).map(([l, v]) => <div key={l} className="st-card"><div className="muted">{l}</div><div className="st-stat" data-testid={`stat-${l.toLowerCase()}`}>{v}</div></div>)}</div>
      <div className="st-card" style={{ overflowX: "auto" }}><h2 style={{ marginTop: 0 }}>Per function</h2>
        <table><thead><tr><th>Function</th><th>Invited</th><th>Yes</th><th>Maybe</th><th>No</th><th>Pending</th><th>Adults</th><th>Kids</th><th>Veg</th><th>Jain</th><th>Vegan</th><th>Non-veg</th></tr></thead>
          <tbody>{d.fns.map((f) => <tr key={f.id}><td><b>{f.title}</b></td><td>{f.invited}</td><td>{f.yes}</td><td>{f.maybe}</td><td>{f.no}</td><td>{f.pending}</td><td data-testid={`adults-${f.id}`}>{f.adults}</td><td>{f.kids}</td><td>{f.food.veg}</td><td>{f.food.jain}</td><td>{f.food.vegan}</td><td>{f.food["non-veg"]}</td></tr>)}</tbody></table></div>
      <div className="st-card"><h2 style={{ marginTop: 0 }}>Opened but not replied</h2>{d.openedNotReplied.length ? d.openedNotReplied.map((g) => <span key={g.id} className="st-pill warn" style={{ margin: 3 }}>{g.salutation}</span>) : <p className="muted">Nobody yet.</p>}</div>
      <div className="st-card" style={{ overflowX: "auto" }}><h2 style={{ marginTop: 0 }}>Outstation &amp; stay</h2>
        <table><thead><tr><th>Guest</th><th>Room</th><th>Arrival</th><th>By</th><th>Ref</th><th>Pickup</th><th>Stay</th></tr></thead><tbody>{d.outstation.map((o) => <tr key={o.id}><td>{o.salutation}</td><td>{o.room}</td><td>{o.arrival}</td><td>{o.mode}</td><td>{o.ref}</td><td>{o.pickup ? "✓" : ""}</td><td>{o.stay ? "✓" : ""}</td></tr>)}</tbody></table></div>
      <div className="st-card"><h2 style={{ marginTop: 0 }}>Songs, team votes, blessings</h2>
        <p>Team Ladkewale {s.extras.votes.ladkewale} · Team Ladkiwale {s.extras.votes.ladkiwale}</p>
        <ul>{s.extras.songs.map((x, i) => <li key={i}>{x.text}</li>)}</ul>
        <ul>{s.extras.blessings.map((b, i) => <li key={i}><i>{b.blessing}</i> <span className="muted">by {s.guests.find((g) => g.id === b.guestId)?.salutation}</span></li>)}</ul>
      </div>
    </div>
  );
}

function ShagunTab({ id, s, reload, flash }: { id: string; s: Summary; reload: () => Promise<void>; flash: (m: string) => void }) {
  const w = s.wedding;
  const sh = w.content.shagun;
  const [vpa, setVpa] = useState(sh?.vpa ?? ""); const [payee, setPayee] = useState(sh?.payeeName ?? "");
  const [err, setErr] = useState("");
  const blocks = new Map((sh?.funds ?? []).flatMap((f) => f.blocks.map((b) => [b.id, `${f.title}: ${b.title}`] as const)));
  const save = async (enabled: boolean) => {
    setErr("");
    const shagun = { enabled, vpa, payeeName: payee, funds: sh?.funds ?? [{ id: "fund1", title: "Humare sapne", blocks: [501, 1100, 2100, 5100, 11000, 21000].map((a, i) => ({ id: `b${i + 1}`, title: `Shagun ${formatINR(a)}`, amount: a, emoji: "🪔" })).concat([{ id: "bany", title: "Any amount", amount: null as never, emoji: "💛" }]) }], gifts: sh?.gifts ?? [], showProgress: false };
    const r = await api(id, "wedding", "PATCH", { content: { ...w.content, shagun } });
    if (!r.ok) setErr(r.error); else { await reload(); flash("Shagun settings saved"); }
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="st-card" style={{ display: "grid", gap: 10, maxWidth: 560 }}>
        <h2 style={{ margin: 0 }}>Shagun wishlist</h2>
        <p className="st-note">Guests pay you directly by UPI. We never hold or route money. Your UPI ID is locked after setup; changing it needs your phone OTP and a 24-hour wait, and we notify you by SMS and email.</p>
        {!s.entitlements.shagun && <p className="st-err">Shagun is part of the Signature plan.</p>}
        <div className="st-row"><label>Your UPI ID<input value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="name@okbank" /></label><label>Name shown in UPI apps<input value={payee} onChange={(e) => setPayee(e.target.value)} /></label></div>
        <div className="st-row"><button className="st-btn primary" style={{ flex: "0 0 auto" }} onClick={() => save(true)}>{sh?.enabled ? "Save" : "Enable shagun"}</button>{sh?.enabled && <button className="st-btn" style={{ flex: "0 0 auto" }} onClick={() => save(false)}>Turn off</button>}</div>
        {err && <p className="st-err">{err}</p>}
        <p className="muted" style={{ margin: 0 }}>Choose who sees it in Guests → Shagun column.</p>
      </div>
      <div className="st-card" style={{ overflowX: "auto" }}><h2 style={{ marginTop: 0 }}>Ledger</h2>
        <p className="muted">Pledges are on the honour system: confirm each one once you see it in your bank app. Only you can see names and amounts.</p>
        <table><thead><tr><th>Guest</th><th>For</th><th>Amount</th><th>When</th><th></th></tr></thead>
          <tbody>{s.pledges.map((p) => <tr key={p.id}><td>{s.guests.find((g) => g.id === p.guestId)?.salutation}</td><td>{blocks.get(p.blockId) ?? p.blockId}</td><td>{p.amount ? formatINR(p.amount) : "Any"}</td><td>{new Date(p.pledgedAt).toLocaleDateString("en-IN")}</td>
            <td>{p.confirmedAt ? <span className="st-pill ok">Received</span> : <button className="st-btn" onClick={async () => { await api(id, `pledges/${p.id}/confirm`, "POST"); await reload(); }}>Mark received</button>}</td></tr>)}</tbody></table>
        <p><b>Total confirmed: {formatINR(s.pledges.filter((p) => p.confirmedAt).reduce((a, p) => a + (p.amount ?? 0), 0))}</b></p>
      </div>
    </div>
  );
}

function PlanTab({ id, s, reload, flash }: { id: string; s: Summary; reload: () => Promise<void>; flash: (m: string) => void }) {
  return (
    <div className="st-grid">{(["classic", "signature", "couture"] as const).map((t) => {
      const p = tiers[t]; const e = p.entitlements;
      return (
        <div key={t} className="st-card" style={{ display: "grid", gap: 8, borderColor: s.wedding.tier === t ? "var(--ui-accent)" : undefined }}>
          <b style={{ fontSize: 18 }}>{p.name}</b>
          <div className="st-stat">{formatINR(p.inr)} <span className="muted" style={{ fontSize: 14 }}>/ ${p.usd}</span></div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            <li>{e.maxGuestLinks ? `Up to ${e.maxGuestLinks}` : "Unlimited"} personal guest links</li><li>RSVP + dashboard, static cards, QR</li>
            {e.shagun && <li>Shagun wishlist, Ashirwad Book, song requests, live updates</li>}{e.videoVariants > 0 && <li>{e.videoVariants} video variants</li>}
            {e.personalAiAssets && <li>Personal AI art (venue watercolour, your puppets, city skyline), remove our footer</li>}
          </ul>
          <button className="st-btn primary" disabled={s.wedding.tier === t} onClick={async () => { const r = await api(id, "pay", "POST", { tier: t, currency: "INR" }); if (r.paid) { await reload(); flash(`${p.name} active (mock payment)`); } else flash("Opening Razorpay…"); }}>{s.wedding.tier === t ? "Current plan" : `Choose ${p.name}`}</button>
        </div>);
    })}<p className="muted">Prices include GST. Full refund before the first guest link is sent.</p></div>
  );
}

function ExportsTab({ id, s }: { id: string; s: Summary }) {
  return (
    <div className="st-card" style={{ display: "grid", gap: 10, maxWidth: 560 }}>
      <a className="st-btn" href={`/api/studio/weddings/${id}/export/guests.csv`}>Guest list + RSVPs (CSV, opens in Excel)</a>
      <a className="st-btn" href={`/api/studio/weddings/${id}/export/caterer.csv`}>Caterer summary (CSV)</a>
      <a className="st-btn" href={`/api/studio/weddings/${id}/export/card?size=1080x1350`}>Static card (1080×1350)</a>
      <a className="st-btn" href={`/api/studio/weddings/${id}/export/qr-card`}>Printable QR card (PDF)</a>
      <a className="st-btn" href={`/api/studio/weddings/${id}/export/video`}>Vertical video (MP4)</a>
      <p className="muted" style={{ margin: 0 }}>Cards, QR and video are rendered by the render worker ({s.wedding.templateId}).</p>
    </div>
  );
}
