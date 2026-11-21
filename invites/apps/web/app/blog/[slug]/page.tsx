import { notFound } from "next/navigation";
import { Shell } from "@/components/marketing/Shell";
import { POSTS } from "@/lib/content/posts";
export function generateStaticParams() { return POSTS.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const k = (await params).slug; const p = POSTS.find((x) => x.slug === k); return { title: p?.title ?? "Blog" }; }
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const k = (await params).slug;
  const p = POSTS.find((x) => x.slug === k);
  if (!p) notFound();
  return <Shell><main className="mk-wrap mk-prose" style={{ paddingBottom: 40 }}><h1>{p.title}</h1><p style={{ color: "var(--mk-soft)" }}>{p.date}</p>{p.body.map((b, i) => <p key={i}>{b}</p>)}</main></Shell>;
}
