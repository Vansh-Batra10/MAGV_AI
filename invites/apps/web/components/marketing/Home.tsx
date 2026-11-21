import Link from "next/link";
import { formatINR } from "@invites/config";
import { copy, tiers, TEMPLATES, type Lang } from "@/lib/content/marketing";
import { LiveDemo } from "./LiveDemo";
import { Shell } from "./Shell";

export function Home({ lang }: { lang: Lang }) {
  const c = copy[lang];
  return (
    <Shell lang={lang}>
      <main className="mk-wrap">
        <section className="mk-hero">
          <div><h1>{c.h1}</h1><p>{c.sub}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="mk-cta" href="/studio/new">{c.cta}</Link><Link className="mk-cta alt" href="/demo/mehtaPAR1">{c.ctaAlt}</Link></div></div>
          <LiveDemo tapLabel={c.tap} />
        </section>
        <section className="mk-sec"><h2>{c.whyTitle}</h2><div className="mk-cols">{c.why.map(([h, p]) => <div key={h} className="mk-card"><h3 style={{ marginTop: 0 }}>{h}</h3><p>{p}</p></div>)}</div></section>
        <section className="mk-sec"><h2>{c.tplTitle}</h2><div className="mk-cols">{TEMPLATES.map((t) => (
          <Link key={t.id} href={`/templates/${t.id}`} className="mk-card" style={{ textDecoration: "none" }}>
            <img className="mk-tplimg" src={`/marketing/${t.id}-open.jpg`} alt={t.name} loading="lazy" width={360} height={440} />
            <h3>{t.name}</h3><p>{t.line}</p></Link>))}</div></section>
        <section className="mk-sec"><h2>{c.howTitle}</h2><ol className="mk-cols" style={{ paddingLeft: 18 }}>{c.how.map((s) => <li key={s} className="mk-card" style={{ fontSize: 17 }}>{s}</li>)}</ol></section>
        <section className="mk-sec"><h2>{c.priceTitle}</h2><div className="mk-cols">{(["classic", "signature", "couture"] as const).map((k) => <div key={k} className="mk-card"><b>{tiers[k].name}</b><div className="mk-price">{formatINR(tiers[k].inr)}</div><p>${tiers[k].usd} outside India</p></div>)}</div><p style={{ color: "var(--mk-soft)" }}>{c.priceNote}</p></section>
      </main>
    </Shell>
  );
}
