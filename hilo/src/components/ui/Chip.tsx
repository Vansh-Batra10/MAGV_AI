"use client";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Chip({ selected, onClick, children, className, as = "button" }: { selected?: boolean; onClick?: () => void; children: ReactNode; className?: string; as?: "button" | "span" }) {
  const cls = cn(
    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap",
    selected
      ? "border-[rgba(var(--glow-rgb),0.8)] bg-[rgba(var(--glow-rgb),0.12)] text-hi shadow-[0_0_24px_-6px_rgba(var(--glow-rgb),0.7)]"
      : "border-white/10 bg-white/[0.04] text-mid hover:text-hi hover:border-white/20",
    className,
  );
  if (as === "span") return <span className={cls}>{children}</span>;
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
