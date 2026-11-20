"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { RENDERERS } from "@/templates/renderers";
import { getTemplate } from "@/templates/registry";
import { displayName, pick } from "@/templates/types";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { usePerf } from "@/lib/client/perf";
import type { GiftLanguage } from "@/config/markets";
import { useSite } from "./SiteContext";
import { cn } from "@/lib/cn";

/** Plays the real template in thumbnail mode — only while on screen. Poster image otherwise. */
export function LiveThumb({ slug, className, glow = true, tilt = false }: { slug: string; className?: string; glow?: boolean; tilt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const perf = usePerf();
  const lang = useLocale() as GiftLanguage;
  const tpl = getTemplate(slug)!;
  const R = RENDERERS[slug];
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const play = visible && !perf.reduced;
  return (
    <div ref={ref} data-glow={tpl.meta.glow} className={className}>
      <PhoneFrame glow={glow} tilt={tilt}>
        {play ? (
          <R content={tpl.defaults(lang)} mode="thumbnail" watermark={false} ctx={{ lang, recipientName: tpl.defaults(lang).recipientName, senderFirstName: tpl.defaults(lang).senderName }} />
        ) : (
          <div className="relative h-full w-full">
            <img src={tpl.meta.demoPoster} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
            <p className="absolute bottom-24 left-0 right-0 px-8 text-center font-display text-[40px] leading-tight text-hi">{pick(tpl.meta.name, lang)}</p>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}

export function TemplateCard({ slug, priceLabel }: { slug: string; priceLabel?: string }) {
  const { href, market } = useSite();
  const lang = useLocale() as GiftLanguage;
  const tpl = getTemplate(slug)!;
  return (
    <Link href={href(`/t/${slug}`)} className="group block" data-glow={tpl.meta.glow}>
      <LiveThumb slug={slug} className="mx-auto max-w-[260px] transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1.5" />
      <div className="mt-5 text-center">
        <p className="font-display text-[26px] leading-tight text-hi">
          {displayName(tpl.meta, lang, market)}
          {tpl.meta.isNew && <span className="ml-2 inline-block -translate-y-1 rounded-full bg-[rgba(var(--glow-rgb),0.15)] px-2 py-0.5 align-middle font-sans text-[10px] font-bold uppercase tracking-wider text-[var(--glow)]">New</span>}
        </p>
        <p className="mx-auto mt-1 max-w-[260px] text-sm leading-snug text-mid">{pick(tpl.meta.tagline, lang)}</p>
        {priceLabel && <p className={cn("mt-2 text-sm font-semibold", tpl.meta.tier === "free" ? "text-emerald-300" : "text-hi")}>{priceLabel}</p>}
      </div>
    </Link>
  );
}
