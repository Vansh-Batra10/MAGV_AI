"use client";
import { useEffect, useMemo, useState } from "react";
import type { CeremonyStyle, EventKind, Locale, Motif, Tone, WeddingContent, WeddingEvent } from "@invites/content-schema";

const TEMPLATES = [
  { id: "sheesh-mahal", name: "Sheesh Mahal", note: "Palace doors open into light; your names in mirror mosaic.", packs: [["jaipur-dusk", "Jaipur Dusk"], ["udaipur-lake-dawn", "Udaipur Lake Dawn"], ["mysore-palace-lights", "Mysore Palace Lights"]] },
  { id: "rang-kahani", name: "Rang Kahani", note: "A pop-up storybook where you two are paper puppets.", packs: [["bombay-monsoon", "Bombay Monsoon"], ["dilli-sardi", "Dilli Sardi"], ["goa-sunset", "Goa Sunset"]] },
  { id: "mohar", name: "Mohar", note: "A keepsake box: press the wax seal, the suite unfolds.", packs: [["plum-olive", "Plum & Olive"], ["powder-blue-baroque", "Powder Blue Baroque"], ["opal-night", "Opal Night"]] },
] as const;
const KINDS: [EventKind, string, string][] = [["haldi", "Haldi", "हल्दी"], ["mehendi", "Mehendi", "मेहंदी"], ["sangeet", "Sangeet", "संगीत"], ["cocktail", "Cocktail", "कॉकटेल"], ["wedding", "Wedding", "विवाह"], ["reception", "Reception", "स्वागत समारोह"]];
const STYLES: [CeremonyStyle, string, Motif][] = [["hindu-north", "Hindu (North)", "ganesh"], ["hindu-south", "Hindu (South)", "om"], ["anand-karaj", "Sikh: Anand Karaj", "ik-onkar"], ["nikah", "Muslim: Nikah", "bismillah"], ["church", "Christian", "cross"], ["jain", "Jain", "none"], ["interfaith", "Inter-faith", "none"], ["secular", "Secular", "none"]];
const MOTIFS: [Motif, string][] = [["ganesh", "Shri Ganesh"], ["om", "Om"], ["ik-onkar", "Ik Onkar"], ["khanda", "Khanda"], ["bismillah", "Bismillah"], ["cross", "Cross"], ["none", "None"]];

interface Fn { on: boolean; kind: EventKind; date: string; time: string; venue: string; area: string }
const plus = (days: number) => new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [bride, setBride] = useState(""); const [brideHi, setBrideHi] = useState("");
  const [groom, setGroom] = useState(""); const [groomHi, setGroomHi] = useState("");
  const [order, setOrder] = useState<"bride-first" | "groom-first">("bride-first");
  const [brideParents, setBP] = useState(""); const [groomParents, setGP] = useState(""); const [city, setCity] = useState("");
  const [fns, setFns] = useState<Fn[]>(KINDS.map(([k]) => ({ on: k === "wedding" || k === "reception" || k === "sangeet", kind: k, date: plus(90 + (k === "reception" ? 1 : k === "wedding" ? 0 : -1)), time: k === "haldi" ? "10:00" : k === "mehendi" ? "16:00" : "19:30", venue: "", area: "" })).map((f, i) => ({ ...f, time: i === 4 ? "19:00" : f.time })));
  const [style, setStyle] = useState<CeremonyStyle>("hindu-north");
  const [motifs, setMotifs] = useState<Motif[]>(["ganesh"]);
  const [locale, setLocale] = useState<Locale>("hinglish"); const [tone, setTone] = useState<Tone>("warm");
  const [template, setTemplate] = useState("sheesh-mahal"); const [pack, setPack] = useState("jaipur-dusk");
  const [story, setStory] = useState(["", "", ""]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const content: WeddingContent = useMemo(() => {
    const events: WeddingEvent[] = fns.filter((f) => f.on).map((f) => {
      const [, en, hi] = KINDS.find((k) => k[0] === f.kind)!;
      return { id: f.kind, kind: f.kind, titleEn: f.kind === "wedding" && style === "nikah" ? "Nikah" : f.kind === "wedding" && style === "anand-karaj" ? "Anand Karaj" : en, titleHi: hi,
        startsAt: `${f.date}T${f.time}:00+05:30`, tz: "Asia/Kolkata", venueName: f.venue || "Venue to be announced", venueArea: f.area || undefined, dressCode: [], isPublic: f.kind === "wedding" || f.kind === "reception" };
    });
    return {
      inviteId: "draft", bride: { name: bride || "Ananya", nameHi: brideHi || undefined }, groom: { name: groom || "Rohan", nameHi: groomHi || undefined }, order,
      families: { brideParents: brideParents || undefined, groomParents: groomParents || undefined }, city: city || undefined, ceremonyStyle: style, motifs: motifs.length ? motifs : ["none"],
      defaultLocale: locale, defaultTone: tone, devanagariNumerals: false, events: events.length ? events : [], story: story.filter((s) => s.trim()).map((caption) => ({ caption: caption.slice(0, 90) })),
      faq: [], updates: [], hideBrandFooter: false, watermark: true,
    };
  }, [bride, brideHi, groom, groomHi, order, brideParents, groomParents, city, fns, style, motifs, locale, tone, story]);
  useEffect(() => { try { localStorage.setItem("inv:draft", JSON.stringify(content)); } catch { /* ignore */ } }, [content]);

  const steps = ["Names", "Families", "Functions", "Ceremony", "Language", "Template", "Look", "Story"];
  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const create = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/studio/weddings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ templateId: template, packId: pack, content }) }).then((x) => x.json());
    if (!r.ok) { setErr(r.error ?? "Could not create"); setBusy(false); return; }
    location.href = `/studio/${r.id}?tab=preview`;
  };
  const tpl = TEMPLATES.find((t) => t.id === template)!;

  return (
    <main className="st-wrap" style={{ maxWidth: 640 }}>
      <h1>Create your invite</h1>
      <div className="st-steps" aria-hidden="true">{steps.map((s, i) => <i key={s} className={i <= step ? "on" : ""} />)}</div>
      <p className="muted">Step {step + 1} of {steps.length}: <b>{steps[step]}</b></p>
      <form className="st-card" style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); if (step === steps.length - 1) void create(); else next(); }}>
        {step === 0 && <>
          <div className="st-row"><label>Bride&apos;s name<input value={bride} onChange={(e) => setBride(e.target.value)} placeholder="Ananya" required /></label><label>In Hindi (optional)<input value={brideHi} onChange={(e) => setBrideHi(e.target.value)} placeholder="अनन्या" lang="hi" /></label></div>
          <div className="st-row"><label>Groom&apos;s name<input value={groom} onChange={(e) => setGroom(e.target.value)} placeholder="Rohan" required /></label><label>In Hindi (optional)<input value={groomHi} onChange={(e) => setGroomHi(e.target.value)} placeholder="रोहन" lang="hi" /></label></div>
          <label>Whose name comes first?<select value={order} onChange={(e) => setOrder(e.target.value as never)}><option value="bride-first">Bride first</option><option value="groom-first">Groom first</option></select></label>
        </>}
        {step === 1 && <>
          <p className="muted" style={{ margin: 0 }}>Optional. Elders love seeing the family named.</p>
          <label>Bride&apos;s parents<input value={brideParents} onChange={(e) => setBP(e.target.value)} placeholder="Smt. Kavita & Shri Rajesh Mehta" /></label>
          <label>Groom&apos;s parents<input value={groomParents} onChange={(e) => setGP(e.target.value)} placeholder="Smt. Sunita & Shri Anil Sharma" /></label>
          <label>City<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur" /></label>
        </>}
        {step === 2 && fns.map((f, i) => (
          <fieldset key={f.kind} style={{ border: "1px solid var(--ui-line)", borderRadius: 12, padding: 10 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: 20, minHeight: 20 }} checked={f.on} onChange={(e) => setFns(fns.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} />{KINDS[i]![1]}</label>
            {f.on && <div className="st-row" style={{ marginTop: 8 }}>
              <label>Date<input type="date" value={f.date} onChange={(e) => setFns(fns.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} /></label>
              <label>Time<input type="time" value={f.time} onChange={(e) => setFns(fns.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} /></label>
              <label>Venue<input value={f.venue} onChange={(e) => setFns(fns.map((x, j) => (j === i ? { ...x, venue: e.target.value } : x)))} placeholder="Jai Mahal Palace" /></label>
              <label>Area<input value={f.area} onChange={(e) => setFns(fns.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)))} placeholder="Civil Lines" /></label>
            </div>}
          </fieldset>
        ))}
        {step === 3 && <>
          <label>Ceremony style<select value={style} onChange={(e) => { const s = e.target.value as CeremonyStyle; setStyle(s); const m = STYLES.find((x) => x[0] === s)![2]; setMotifs([m]); }}>{STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <div><b style={{ fontSize: 14 }}>Motif at the top of the card</b> <span className="muted">(your choice; we never assume)</span>
            <div className="st-row" style={{ marginTop: 6 }}>{MOTIFS.map(([v, l]) => <button key={v} type="button" className="st-btn" aria-pressed={motifs.includes(v)} onClick={() => setMotifs(v === "none" ? ["none"] : style === "interfaith" ? (motifs.includes(v) ? motifs.filter((x) => x !== v) : [...motifs.filter((x) => x !== "none"), v].slice(-2)) : [v])}>{l}</button>)}</div>
            {style === "interfaith" && <p className="muted">Inter-faith: pick up to two; they sit side by side at equal size.</p>}
          </div>
        </>}
        {step === 4 && <>
          <label>Default language<select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}><option value="hinglish">Hinglish</option><option value="hi">हिन्दी</option><option value="en">English</option></select></label>
          <label>Default tone<select value={tone} onChange={(e) => setTone(e.target.value as Tone)}><option value="formal">Formal (elders)</option><option value="warm">Warm</option><option value="playful">Playful (friends only)</option></select></label>
          <p className="muted" style={{ margin: 0 }}>You can set language and tone per guest group later: formal Hindi for Nani, Hinglish for your gang.</p>
        </>}
        {step === 5 && <div style={{ display: "grid", gap: 10 }}>{TEMPLATES.map((t) => (
          <button key={t.id} type="button" className="st-tpl" aria-pressed={template === t.id} onClick={() => { setTemplate(t.id); setPack(t.packs[0][0]); }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "center" }}>
              <div className="st-phone" style={{ maxWidth: 110, borderWidth: 3, borderRadius: 12 }}><iframe title={t.name} src={`/studio/preview?template=${t.id}&mode=static&t=11`} loading="lazy" style={{ pointerEvents: "none" }} /></div>
              <div><b>{t.name}</b><p className="muted" style={{ margin: "4px 0 0" }}>{t.note}</p></div>
            </div>
          </button>))}</div>}
        {step === 6 && <div className="st-row">{tpl.packs.map(([id, name]) => <button key={id} type="button" className="st-btn" aria-pressed={pack === id} onClick={() => setPack(id)}>{name}</button>)}</div>}
        {step === 7 && <>
          <p className="muted" style={{ margin: 0 }}>Optional: up to 4 short beats of your story (90 characters each). Photos can be added later.</p>
          {story.map((s, i) => <label key={i}>Beat {i + 1}<input value={s} maxLength={90} onChange={(e) => setStory(story.map((x, j) => (j === i ? e.target.value : x)))} /></label>)}
          {story.length < 4 && <button type="button" className="st-btn ghost" onClick={() => setStory([...story, ""])}>+ Add a beat</button>}
        </>}
        {err && <p className="st-err">{err}</p>}
        <div className="st-row" style={{ justifyContent: "space-between" }}>
          <button type="button" className="st-btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)} style={{ flex: "0 0 auto" }}>Back</button>
          <button className="st-btn primary" disabled={busy || (step === 2 && !fns.some((f) => f.on))} style={{ flex: "0 0 auto" }}>{step === steps.length - 1 ? "See my invite →" : "Next"}</button>
        </div>
      </form>
      {step >= 5 && <div style={{ marginTop: 18 }}><p className="muted">Live preview</p><div className="st-phone"><iframe title="Preview" key={`${template}-${pack}`} src={`/studio/preview?template=${template}&pack=${pack}&mode=static&t=11`} /></div></div>}
    </main>
  );
}
