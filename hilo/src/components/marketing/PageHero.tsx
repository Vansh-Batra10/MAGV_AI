import { Starfield } from "@/components/ui/Starfield";
import { ThreadArc } from "@/components/ui/Thread";

export function PageHero({ eyebrow, title, sub, children, glow }: { eyebrow?: string; title: React.ReactNode; sub?: string; children?: React.ReactNode; glow?: string }) {
  return (
    <section data-glow={glow} className="relative overflow-hidden pb-16 pt-36 md:pb-24 md:pt-44">
      <div className="absolute inset-0 [background:var(--grad-aurora)]" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 70% 30%, rgba(var(--glow-rgb),0.14), transparent 70%)" }} />
      <Starfield density={0.9} />
      <ThreadArc color="var(--glow)" d="M -20 560 C 400 500, 700 200, 1220 120" />
      <div className="container-x relative">
        {eyebrow && <p className="eyebrow anim-rise mb-4">{eyebrow}</p>}
        <h1 className="h1 anim-rise max-w-4xl text-hi" style={{ animationDelay: "60ms" }}>{title}</h1>
        {sub && <p className="body-lg anim-rise mt-5 max-w-2xl text-mid" style={{ animationDelay: "120ms" }}>{sub}</p>}
        {children && <div className="anim-rise mt-8" style={{ animationDelay: "180ms" }}>{children}</div>}
      </div>
    </section>
  );
}
