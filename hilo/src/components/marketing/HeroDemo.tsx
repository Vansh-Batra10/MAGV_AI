"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "next-intl";
import { RENDERERS } from "@/templates/renderers";
import { getTemplate } from "@/templates/registry";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { usePerf } from "@/lib/client/perf";
import type { GiftLanguage } from "@/config/markets";

/** Hero phone: auto-cycles LIVE demos of 3 templates, 6s each, with a crossfade. */
export function HeroDemo({ slugs, label }: { slugs: string[]; label: string }) {
  const [i, setI] = useState(0);
  const perf = usePerf();
  const lang = useLocale() as GiftLanguage;
  useEffect(() => {
    if (perf.reduced) return;
    const id = setInterval(() => setI((x) => (x + 1) % slugs.length), 6000);
    return () => clearInterval(id);
  }, [slugs.length, perf.reduced]);
  const slug = slugs[i];
  const tpl = getTemplate(slug)!;
  const R = RENDERERS[slug];
  const c = tpl.defaults(lang);
  return (
    <div data-glow={tpl.meta.glow} className="relative mx-auto w-full max-w-[300px] md:max-w-[330px]" style={{ transform: "perspective(1400px) rotateY(-8deg) rotateX(4deg)" }}>
      <PhoneFrame tilt>
        <AnimatePresence mode="popLayout">
          <motion.div key={slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <R content={c} mode="thumbnail" watermark={false} ctx={{ lang, recipientName: c.recipientName, senderFirstName: c.senderName, speed: 1.6 }} />
          </motion.div>
        </AnimatePresence>
      </PhoneFrame>
      <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-lo">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--glow)] shadow-[0_0_8px_var(--glow)]" /> {label}
        <span className="ml-2 flex gap-1">{slugs.map((s, k) => <span key={s} className={`h-1 rounded-full transition-all ${k === i ? "w-4 bg-white/70" : "w-1 bg-white/25"}`} />)}</span>
      </div>
    </div>
  );
}
