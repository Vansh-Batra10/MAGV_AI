import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/marketing/Shell";
import { TEMPLATES } from "@/lib/content/marketing";

export function generateStaticParams() { return TEMPLATES.map((t) => ({ id: t.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const k = (await params).id; const t = TEMPLATES.find((x) => x.id === k); return { title: t ? `${t.name}: ${t.tag}` : "Template" }; }

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const k = (await params).id;
  const t = TEMPLATES.find((x) => x.id === k);
  if (!t) notFound();
  return (
    <Shell><main className="mk-wrap">
      <section className="mk-hero">
        <div><p style={{ margin: 0 }}>{t.tag}</p><h1>{t.name}</h1><p>{t.line}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="mk-cta" href="/studio/new">Start with {t.name}</Link><Link className="mk-cta alt" href={t.demo}>Open the live demo</Link></div></div>
        <div className="mk-phone"><img src={`/marketing/${t.id}.jpg`} alt={`${t.name} opening`} width={360} height={740} /></div>
      </section>
      <section className="mk-sec"><h2>Three packs</h2><div className="mk-cols">{t.packs.map((p) => <div key={p} className="mk-card"><h3 style={{ marginTop: 0 }}>{p}</h3><p>Same choreography, its own palette and art.</p></div>)}</div></section>
      <section className="mk-sec"><div className="mk-cols">{TEMPLATES.filter((x) => x.id !== t.id).map((x) => <Link key={x.id} className="mk-card" href={`/templates/${x.id}`} style={{ textDecoration: "none" }}><h3 style={{ marginTop: 0 }}>{x.name}</h3><p>{x.line}</p></Link>)}</div></section>
    </main></Shell>
  );
}
