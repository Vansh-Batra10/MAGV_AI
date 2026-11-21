"use client";
import { useState } from "react";

export function PublicNameForm({ inviteCode }: { inviteCode: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      setBusy(true);
      const r = await fetch(`/api/p/${inviteCode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).then((x) => x.json()).catch(() => null);
      if (r?.guestCode) location.href = `/${inviteCode}/${r.guestCode}`; else setBusy(false);
    }} style={{ display: "grid", gap: 12 }}>
      <label htmlFor="pn" style={{ fontSize: 22, fontWeight: 600 }}>Aapka naam?</label>
      <input id="pn" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" style={{ minHeight: 48, fontSize: 18, padding: "8px 12px", borderRadius: 10, border: 0 }} />
      <button disabled={busy} style={{ minHeight: 48, fontSize: 17, fontWeight: 700, borderRadius: 10, border: 0, background: "#E3C48A" }}>Continue</button>
    </form>
  );
}
