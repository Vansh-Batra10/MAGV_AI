"use client";
import { useEffect, useMemo, useState } from "react";
import { sampleGuests, sampleWedding, stressPresets, WeddingContent, type GuestVars } from "@invites/content-schema";
import type { GuestServices, Invite, Mode, Tier } from "@invites/renderer";
import { InviteMount } from "@/components/InviteMount";
import { loadTemplate, TEMPLATE_IDS } from "@/lib/templates";

const presets: Record<string, { content: WeddingContent; guest: GuestVars }> = {
  "demo: elder (formal Hindi)": { content: sampleWedding, guest: sampleGuests.elder! },
  "demo: friend (playful Hinglish)": { content: sampleWedding, guest: sampleGuests.friend! },
  "demo: office (formal English)": { content: sampleWedding, guest: sampleGuests.office! },
  ...stressPresets,
};

function useQuery() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => setQ(new URLSearchParams(window.location.search)), []);
  return q;
}

const mockServices: GuestServices = {
  async submitRsvp() { await new Promise((r) => setTimeout(r, 300)); return { ok: true }; },
  async pledge() { return { ok: true }; },
  async claimGift() { return { ok: true }; },
  track() {},
  publicCounts: { confirmedHouseholds: 23 },
  shareUrl: "https://nimantran.example/demo/riyaFRND2",
};

export function Playground() {
  const q = useQuery();
  if (!q) return null;
  return <PlaygroundInner q={q} />;
}

function PlaygroundInner({ q }: { q: URLSearchParams }) {
  const embed = q.get("embed") === "1";
  const [templateId, setTemplateId] = useState(q.get("template") ?? "sheesh-mahal");
  const [pack, setPack] = useState(q.get("pack") ?? "");
  const [packs, setPacks] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>((q.get("mode") as Mode) ?? "interactive");
  const [tier, setTier] = useState<Tier | "">((q.get("tier") as Tier) ?? "");
  const [locale, setLocale] = useState(q.get("locale") ?? "");
  const [tone, setTone] = useState(q.get("tone") ?? "");
  const [preset, setPreset] = useState(q.get("preset") ?? Object.keys(presets)[1]!);
  const [json, setJson] = useState(() => JSON.stringify(presets[preset]?.content ?? sampleWedding, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [content, setContent] = useState<WeddingContent>(presets[preset]?.content ?? sampleWedding);
  const [inv, setInv] = useState<Invite | null>(null);
  const [time, setTime] = useState(Number(q.get("t") ?? 0));
  const [fps, setFps] = useState(0);
  const [slots, setSlots] = useState<{ id: string; maxBytes: number; fallback: string }[]>([]);
  const guest = presets[preset]?.guest ?? sampleGuests.friend!;

  useEffect(() => { loadTemplate(templateId).then((t) => { setPacks(t.manifest.packs); setSlots(t.manifest.slots); }); }, [templateId]);
  useEffect(() => { const p = presets[preset]; if (p) { setContent(p.content); setJson(JSON.stringify(p.content, null, 2)); } }, [preset]);
  useEffect(() => {
    if (embed) return;
    let frames = 0, last = performance.now(), raf = 0;
    const loop = (now: number) => { frames++; if (now - last > 500) { setFps(Math.round((frames * 1000) / (now - last))); frames = 0; last = now; } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [embed]);
  useEffect(() => { if (inv && (mode === "autoplay" || mode === "static")) inv.seek(time); }, [inv, time, mode]);

  const scripted = mode === "autoplay" || mode === "static";
  const mountEl = (
    <InviteMount
      templateId={templateId} themePack={pack || undefined} content={content} guest={guest} mode={mode}
      tier={tier || undefined} locale={(locale || undefined) as never} tone={(tone || undefined) as never}
      services={mockServices} skipLoader={q.get("loader") === "0"} dpr={q.get("dpr") ? Number(q.get("dpr")) : undefined}
      onReady={(i) => { setInv(i); if (scripted) i.seek(time); }}
    />
  );
  const duration = inv?.storyboard?.duration ?? 40;
  const body = useMemo(() => mountEl, [templateId, pack, content, guest, mode, tier, locale, tone]);
  if (embed) return body;

  const sel = (label: string, value: string, set: (v: string) => void, opts: string[]) => (
    <label style={{ display: "grid", gap: 2, fontSize: 12 }}>{label}
      <select value={value} onChange={(e) => set(e.target.value)}>{opts.map((o) => <option key={o} value={o}>{o || "(auto)"}</option>)}</select>
    </label>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 12, borderRight: "1px solid #ddd", display: "grid", gap: 10, alignContent: "start", fontSize: 13, background: "#fff", position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
        <strong>Playground</strong>
        {sel("Template", templateId, setTemplateId, TEMPLATE_IDS)}
        {sel("Pack", pack, setPack, ["", ...packs])}
        {sel("Mode", mode, (v) => setMode(v as Mode), ["interactive", "autoplay", "static", "lite", "reduced-motion"])}
        {sel("Tier", tier, (v) => setTier(v as Tier), ["", "A", "B", "C"])}
        {sel("Locale", locale, setLocale, ["", "en", "hi", "hinglish"])}
        {sel("Tone", tone, setTone, ["", "formal", "warm", "playful"])}
        {sel("Preset", preset, setPreset, Object.keys(presets))}
        <div>FPS: <b>{fps}</b> · tier: <b>{inv?.tier ?? "…"}</b></div>
        {scripted && (
          <label style={{ display: "grid", gap: 2 }}>t = {time.toFixed(2)} s / {duration.toFixed(1)}
            <input type="range" min={0} max={duration} step={0.05} value={time} onChange={(e) => setTime(Number(e.target.value))} />
          </label>
        )}
        <details><summary>Slot budgets</summary>
          <table style={{ fontSize: 11 }}><tbody>{slots.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.maxBytes ? `${Math.round(s.maxBytes / 1024)} KB` : "—"}</td><td>{s.fallback === "procedural" ? "0 B (procedural)" : ""}</td></tr>)}</tbody></table>
        </details>
        <details><summary>Content JSON</summary>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} style={{ width: "100%", height: 300, fontFamily: "monospace", fontSize: 11 }} />
          <button onClick={() => { try { setContent(WeddingContent.parse(JSON.parse(json))); setJsonError(null); } catch (e) { setJsonError(String(e)); } }}>Apply</button>
          {jsonError && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{jsonError}</pre>}
        </details>
      </aside>
      <main style={{ background: "#222" }}>
        <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>{body}</div>
      </main>
    </div>
  );
}
