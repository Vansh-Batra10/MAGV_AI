import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Starfield } from "@/components/ui/Starfield";

/** Slim chrome for app routes (checkout, success, dashboard…). */
export function AppChrome({ children, glow = "rose", right }: { children: React.ReactNode; glow?: string; right?: React.ReactNode }) {
  return (
    <div data-glow={glow} className="relative min-h-[100dvh] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 [background:var(--grad-aurora)] opacity-70" />
      <div className="pointer-events-none fixed inset-0"><Starfield density={0.4} shooting={false} /></div>
      <header className="relative z-20 flex items-center justify-between px-5 pt-[max(14px,env(safe-area-inset-top))] md:px-10">
        <Link href="/" aria-label="Home"><Logo animate={false} /></Link>
        <div className="flex items-center gap-3 text-sm text-mid">{right}</div>
      </header>
      <main className="relative z-10 px-5 pb-16 pt-8 md:px-10 md:pt-12">{children}</main>
    </div>
  );
}
