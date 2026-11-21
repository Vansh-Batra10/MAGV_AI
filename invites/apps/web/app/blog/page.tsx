import Link from "next/link";
import { Shell } from "@/components/marketing/Shell";
import { POSTS } from "@/lib/content/posts";
export const metadata = { title: "Blog" };
export default function Blog() {
  return <Shell><main className="mk-wrap" style={{ paddingBottom: 40 }}><h1 style={{ fontSize: 40 }}>Blog</h1><div className="mk-cols">{POSTS.map((p) => <Link key={p.slug} href={`/blog/${p.slug}`} className="mk-card" style={{ textDecoration: "none" }}><h3 style={{ marginTop: 0 }}>{p.title}</h3><p>{p.date}</p></Link>)}</div></main></Shell>;
}
