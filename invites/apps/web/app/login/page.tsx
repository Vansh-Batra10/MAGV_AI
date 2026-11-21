"use client";
import { useState } from "react";
import { brand } from "@invites/config";
import "../studio/studio.css";

export default function Login() {
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [mock, setMock] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [consent, setConsent] = useState(false);
  return (
    <main className="st" style={{ display: "grid", placeItems: "center", padding: 20 }}>
      <form className="st-card" style={{ width: "100%", maxWidth: 380, display: "grid", gap: 12 }} onSubmit={async (e) => {
        e.preventDefault(); setErr("");
        if (!sent) {
          const r = await fetch("/api/auth/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) }).then((x) => x.json());
          if (!r.ok) return setErr(r.error ?? "Could not send code");
          setSent(true); setMock(r.mockCode ?? null);
        } else {
          const r = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) }).then((x) => x.json());
          if (!r.ok) return setErr("That code didn't match. Try again.");
          location.href = new URLSearchParams(location.search).get("next") ?? "/studio";
        }
      }}>
        <h1>{brand.name}</h1>
        <p className="muted" style={{ margin: 0 }}>Log in with your phone. No password.</p>
        <label>Phone number<input name="phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} /></label>
        {!sent && <label style={{ display: "flex", gap: 8, alignItems: "start", fontWeight: 400 }}><input type="checkbox" style={{ width: 20, minHeight: 20 }} checked={consent} onChange={(e) => setConsent(e.target.checked)} />I agree to the privacy notice: we use my number to log me in and to protect shagun payments, and the guest data I add only to send my invitations.</label>}
        {sent && <label>6-digit code<input name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></label>}
        {mock && <p className="st-note">Mock mode: your code is <b data-testid="mock-code">{mock}</b></p>}
        {err && <p className="st-err">{err}</p>}
        <button className="st-btn primary" disabled={!sent && !consent}>{sent ? "Verify" : "Send code"}</button>
      </form>
    </main>
  );
}
