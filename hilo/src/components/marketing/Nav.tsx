"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useSite } from "./SiteContext";
import { cn } from "@/lib/cn";

export function Nav() {
  const t = useTranslations("nav");
  const { href } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    { href: href("/gifts"), label: t("gifts") },
    { href: href("/group"), label: t("group") },
    { href: href("/long-distance"), label: t("longDistance") },
    { href: href("/pricing"), label: t("pricing") },
    { href: href("/reviews"), label: t("reviews") },
  ];
  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "py-2" : "py-4")}>
        <div className={cn("mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-3 transition-all duration-300 md:px-4", scrolled ? "glass-strong mx-3 h-14 md:mx-auto" : "h-14 border border-transparent")}>
          <Link href={href("/")} aria-label="Home" className="pl-2"><Logo /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((l) => <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[14px] font-medium text-mid transition hover:bg-white/5 hover:text-hi">{l.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden rounded-full px-3 py-2 text-[14px] text-mid hover:text-hi sm:block">{t("dashboard")}</Link>
            <ButtonLink href={href("/gifts")} size="sm" className="h-10 px-5">{t("cta")}</ButtonLink>
            <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full text-hi lg:hidden" aria-label={t("menu")} aria-expanded={open}><Menu size={22} /></button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[70] bg-ink-950/80 backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true">
          <div className="flex h-full flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
            <div className="flex items-center justify-between"><Logo animate={false} /><button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-hi" aria-label={t("close")}><X size={22} /></button></div>
            <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile">
              {links.map((l, i) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="anim-rise flex h-16 items-center border-b border-white/6 font-display text-[36px] text-hi" style={{ animationDelay: `${i * 60}ms` }}>{l.label}</Link>
              ))}
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex h-16 items-center font-display text-[36px] text-mid">{t("dashboard")}</Link>
            </nav>
            <ButtonLink href={href("/gifts")} size="lg" className="mt-auto w-full" onClick={() => setOpen(false)}>{t("cta")}</ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
