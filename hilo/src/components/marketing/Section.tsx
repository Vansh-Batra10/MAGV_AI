import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

export function Section({ children, className, id, glow }: { children: React.ReactNode; className?: string; id?: string; glow?: string }) {
  return (
    <section id={id} data-glow={glow} className={cn("relative py-20 md:py-28", className)}>
      {children}
    </section>
  );
}

export function SectionHead({ eyebrow, title, sub, center = true }: { eyebrow?: string; title: React.ReactNode; sub?: string; center?: boolean }) {
  return (
    <Reveal className={cn("mb-12 md:mb-16", center && "text-center")}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className={cn("h2 text-hi", center && "mx-auto max-w-3xl")}>{title}</h2>
      {sub && <p className={cn("body-lg mt-4 text-mid", center && "mx-auto max-w-xl")}>{sub}</p>}
    </Reveal>
  );
}
