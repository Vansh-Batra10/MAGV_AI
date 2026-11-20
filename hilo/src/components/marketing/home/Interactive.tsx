"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { useSite } from "../SiteContext";
import { LiveThumb } from "../TemplateCard";
import { OCCASION_ART, Envelope, Polaroid } from "@/components/art";
import { NightGlobe } from "@/templates/laal-dhaaga/Renderer";
import { CITIES, timeIn, type City } from "@/data/cities";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/config/pricing";
import type { Currency } from "@/config/markets";

export type StripItem = { slug: string; name: string; emoji: string; glow: string; art: string; days: number | null; landing: boolean };

export function OccasionStrip({ items }: { items: StripItem[] }) {
  const t = useTranslations("home.next");
  const { href } = useSite();
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0">
      {items.map((o, k) => {
        const Art = OCCASION_ART[o.art];
        const when = o.days === null ? t("anytime") : o.days === 0 ? t("today") : o.days === 1 ? t("tomorrow") : t("inDays", { n: o.days });
        const inner = (
          <div data-glow={o.glow} className={cn("glass relative flex h-[200px] w-[200px] shrink-0 snap-start flex-col justify-between overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1", k === 0 && o.days !== null && "glow-box")}>
            <div className="absolute -right-6 -top-6 opacity-90">{Art ? Art({ size: 120 }) : null}</div>
            <div className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 100% 0%, rgba(var(--glow-rgb),0.22), transparent 70%)" }} />
            <span className="relative text-2xl">{o.emoji}</span>
            <div className="relative">
              <p className="font-display text-[28px] leading-none text-hi">{o.name}</p>
              <p className={cn("mt-1.5 text-sm", k === 0 && o.days !== null ? "font-semibold text-[var(--glow)]" : "text-mid")}>{when}</p>
            </div>
          </div>
        );
        return o.landing ? <Link key={o.slug} href={href(`/gifts/${o.slug}`)}>{inner}</Link> : <Link key={o.slug} href={href("/gifts")}>{inner}</Link>;
      })}
    </div>
  );
}

export function TryIt() {
  const t = useTranslations("home.tryit");
  const [name, setName] = useState("");
  const shown = name.trim() || "…";
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <h2 className="h2 text-hi">{t("title")}</h2>
        <p className="body-lg mt-3 max-w-md text-mid">{t("sub")}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="tryname">{t("placeholder")}</label>
          <input id="tryname" value={name} onChange={(e) => setName(e.target.value.slice(0, 28))} placeholder={t("placeholder")} className="h-14 flex-1 rounded-full border border-white/12 bg-white/[0.05] px-6 text-[18px] text-hi placeholder:text-lo focus:border-rose-500/60 focus:outline-none" />
          <Link href={`/create/quick-surprise${name.trim() ? `?name=${encodeURIComponent(name.trim())}` : ""}`} className="flex h-14 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.6)]">
            {t("cta")} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <div className="relative mx-auto flex h-[340px] w-full max-w-[380px] items-center justify-center">
        <div className="absolute inset-0 rounded-[40px] opacity-60 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(255,77,126,0.35), transparent)" }} />
        <div className="glass-strong relative w-full p-8 text-center">
          <Envelope size={110} initials={name.trim().slice(0, 1).toUpperCase()} className="mx-auto" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-lo">A surprise for</p>
          <p key={shown} className="mt-1 break-words font-hand text-[48px] leading-tight text-hi" style={{ animation: "rise .5s var(--ease-expo)" }}>{shown}</p>
          <svg viewBox="0 0 300 20" className="mx-auto mt-1 h-5 w-3/4" aria-hidden>
            <path key={shown + "t"} d="M2 10 C 60 2, 120 18, 180 9 S 260 4, 298 10" fill="none" stroke="var(--rose-500)" strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset="1" style={{ animation: "draw .9s var(--ease-expo) forwards", filter: "drop-shadow(0 0 4px #ff4d7e)" }} />
          </svg>
        </div>
      </div>
    </div>
  );
}

const PAIRS: [string, string][] = [["Mumbai", "Toronto"], ["Delhi", "London"], ["Bengaluru", "San Francisco"], ["Pune", "Sydney"], ["Kolkata", "Dubai"], ["New York", "London"], ["Chicago", "Delhi"]];

export function LongDistanceGlobe({ pairs = PAIRS }: { pairs?: [string, string][] }) {
  const [pair, setPair] = useState<[City, City] | null>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    setPair([CITIES.find((c) => c.name === p[0])!, CITIES.find((c) => c.name === p[1])!]);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [pairs]);
  if (!pair) return <div className="aspect-square w-full max-w-[420px]" />;
  return (
    <div className="flex flex-col items-center">
      <div className="anim-floaty"><NightGlobe a={pair[0]} b={pair[1]} size={380} labels={[pair[0].name, pair[1].name]} /></div>
      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
        {pair.map((c) => (
          <div key={c.name} className="glass p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lo">{c.name}</p>
            <p className="mt-1 font-mono text-[24px] tabular-nums text-lavender-300">{timeIn(c.tz, now)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks({ steps, demoSlug }: { steps: { t: string; b: string }[]; demoSlug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    const mq = window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;
    void (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top top",
          end: "+=1600",
          pin: true,
          scrub: 0.6,
          onUpdate: (s) => {
            setActive(Math.min(2, Math.floor(s.progress * 3)));
            if (pathRef.current) pathRef.current.style.strokeDashoffset = String(1 - s.progress);
          },
        });
      }, ref);
    })();
    return () => ctx?.revert();
  }, []);
  return (
    <div ref={ref} className="relative flex min-h-[100dvh] items-center py-20">
      <div className="container-x grid items-center gap-12 md:grid-cols-[1fr_1fr]">
        <ol className="relative flex flex-col gap-10 pl-10">
          <svg className="absolute left-3 top-2 h-[calc(100%-16px)] w-4 overflow-visible" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden>
            <path d="M5 0 C 0 30, 10 60, 5 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path ref={pathRef} d="M5 0 C 0 30, 10 60, 5 100" fill="none" stroke="var(--rose-500)" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1" strokeDashoffset="0" style={{ filter: "drop-shadow(0 0 6px #ff4d7e)" }} />
          </svg>
          {steps.map((s, k) => (
            <li key={k} className={cn("transition-opacity duration-500", active === k ? "opacity-100" : "md:opacity-40")}>
              <span className="absolute -left-0 grid h-7 w-7 -translate-x-[2px] place-items-center rounded-full border border-rose-500/60 bg-ink-950 text-xs font-bold text-rose-400">{k + 1}</span>
              <h3 className="h3 text-hi">{s.t}</h3>
              <p className="body-lg mt-2 max-w-md text-mid">{s.b}</p>
            </li>
          ))}
        </ol>
        <div className="hidden md:block">
          <HowPhone step={active} demoSlug={demoSlug} />
        </div>
      </div>
    </div>
  );
}

function HowPhone({ step, demoSlug }: { step: number; demoSlug: string }) {
  return (
    <div className="relative mx-auto max-w-[300px]">
      <LiveThumb slug={demoSlug} />
      <div className="pointer-events-none absolute -right-10 top-10 flex flex-col gap-3">
        {["🎂", "📸", "💌"].map((e, k) => (
          <span key={k} className={cn("glass grid h-14 w-14 place-items-center text-2xl transition-all duration-500", step === k ? "scale-110 opacity-100 glow-box" : "scale-90 opacity-40")}>{e}</span>
        ))}
      </div>
    </div>
  );
}

export function PricingToggle({ currency, rows, labels }: { currency: Currency; rows: { key: string; name: string; desc: string; h24?: number; forever?: number; free?: boolean; highlight?: boolean }[]; labels: { h24: string; forever: string; free: string; perGift: string } }) {
  const [d, setD] = useState<"h24" | "forever">("forever");
  return (
    <div>
      <div className="mx-auto mb-8 flex w-fit rounded-full border border-white/10 bg-white/5 p-1" role="tablist">
        {(["h24", "forever"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={d === k} type="button" onClick={() => setD(k)} className={cn("h-11 rounded-full px-6 text-sm font-semibold transition", d === k ? "bg-white text-ink-950" : "text-mid")}>{labels[k]}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const price = r.free ? labels.free : (d === "h24" ? r.h24 : r.forever) ?? r.forever;
          return (
            <div key={r.key} className={cn("glass flex flex-col p-6", r.highlight && "glow-box")}>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-lo">{r.name}</p>
              <p className="mt-3 font-display text-[48px] leading-none text-hi">{typeof price === "number" ? formatMoney(price, currency) : price}</p>
              <p className="mt-1 text-xs text-lo">{r.free ? "24h" : d === "h24" && r.h24 ? labels.h24 : labels.forever}</p>
              <p className="mt-4 text-sm leading-relaxed text-mid">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {items.map((it, k) => (
        <div key={k} className="glass overflow-hidden">
          <button type="button" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
            <span className="text-[17px] font-semibold text-hi">{it.q}</span>
            {open === k ? <Minus size={18} className="shrink-0 text-rose-400" /> : <Plus size={18} className="shrink-0 text-mid" />}
          </button>
          <div className={cn("grid transition-[grid-template-rows] duration-300", open === k ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden"><p className="px-5 pb-5 leading-relaxed text-mid">{it.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModesVisual({ kind }: { kind: "solo" | "group" }) {
  if (kind === "solo") return (
    <div className="relative flex h-44 items-center justify-center"><div className="anim-floaty"><Envelope size={150} /></div></div>
  );
  const pics = ["/demo/friends-group.webp", "/demo/cake-cups.webp", "/demo/city-lights.webp", "/demo/fairy-lights.webp"].map((p) => p.replace("cake-cups", "cafe-cups"));
  return (
    <div className="relative flex h-44 items-center justify-center">
      {pics.map((p, k) => (
        <Polaroid key={p} src={p} rotate={(k - 1.5) * 12} className="absolute w-24" style={{ transform: `translateX(${(k - 1.5) * 46}px) rotate(${(k - 1.5) * 12}deg)`, animation: `floaty ${5 + k}s ease-in-out ${k * 0.4}s infinite` }} />
      ))}
    </div>
  );
}
