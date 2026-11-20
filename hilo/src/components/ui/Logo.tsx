import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";

export const THREAD_LOGO_PATH =
  "M4 24 C 14 24, 24 24, 32 22 C 26 18, 21 13, 21 9 C 21 5, 25 3.5, 28 4.5 C 30.5 5.3, 31.5 7, 32 9 C 32.5 7, 33.5 5.3, 36 4.5 C 39 3.5, 43 5, 43 9 C 43 13, 38 18, 32 22 C 40 24, 50 24, 60 24";

/** Two dots joined by one continuous thread that forms a heart. Draws in on mount. */
export function LogoMark({ className, animate = true, size = 40 }: { className?: string; animate?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 64 30" width={size} height={(size * 30) / 64} className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={THREAD_LOGO_PATH}
        fill="none"
        stroke="var(--rose-500)"
        strokeWidth="2.2"
        strokeLinecap="round"
        filter="url(#logoGlow)"
        pathLength={1}
        style={animate ? { strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.6s var(--ease-expo) 0.15s forwards" } : undefined}
      />
      <circle cx="4" cy="24" r="3" fill="var(--rose-400)" />
      <circle cx="60" cy="24" r="3" fill="var(--rose-400)" />
    </svg>
  );
}

export function Logo({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark animate={animate} size={38} />
      <span className="font-display text-[26px] italic leading-none tracking-tight text-hi">{BRAND.name}</span>
    </span>
  );
}
