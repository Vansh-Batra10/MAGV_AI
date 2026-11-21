import Link from "next/link";
import { brand } from "@invites/config";
import { copy, type Lang } from "@/lib/content/marketing";
import "@/app/marketing.css";

export function Shell({ children, lang = "en" }: { children: React.ReactNode; lang?: Lang }) {
  const c = copy[lang];
  return (
    <div className="mk" lang={lang}>
      <header className="mk-nav">
        <Link href={lang === "hi" ? "/hi" : "/"} style={{ textDecoration: "none" }}><b>{brand.name}</b></Link>
        <nav aria-label="Main">
          <Link href="/templates/sheesh-mahal">{c.nav.templates}</Link><Link href="/pricing">{c.nav.pricing}</Link>
          <Link href="/how-it-works">{c.nav.how}</Link><Link href="/blog">{c.nav.blog}</Link>
          <Link href={lang === "hi" ? "/" : "/hi"}>{lang === "hi" ? "English" : "हिन्दी"}</Link><Link href="/studio">{c.nav.login}</Link>
        </nav>
      </header>
      {children}
      <footer className="mk-foot">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/refunds">Refunds</Link><Link href="/legal/grievance">Grievance officer</Link><Link href="/faq">FAQ</Link>
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
      </footer>
    </div>
  );
}
