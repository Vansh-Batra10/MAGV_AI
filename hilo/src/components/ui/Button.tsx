"use client";
import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/client/haptics";

type Variant = "primary" | "glass" | "ghost" | "paper";
type Size = "md" | "lg" | "sm";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none whitespace-nowrap transition-[transform,box-shadow,background,opacity] duration-200 ease-[var(--ease-expo)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};
const variants: Record<Variant, string> = {
  primary:
    "text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_14px_44px_-8px_rgba(255,77,126,0.85),inset_0_1px_0_rgba(255,255,255,0.4)]",
  glass:
    "text-hi bg-white/[0.06] border border-white/12 backdrop-blur-md hover:bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  ghost: "text-mid hover:text-hi",
  paper: "text-ink-text bg-cream-50 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] hover:bg-white",
};

function useMagnet<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.18;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode; magnetic?: boolean };

export function Button({ variant = "primary", size = "md", className, children, magnetic = true, onClick, ...rest }: Common & ComponentProps<"button">) {
  const m = useMagnet<HTMLButtonElement>();
  return (
    <button
      {...rest}
      {...(magnetic ? m : {})}
      onClick={(e) => {
        haptic(10);
        onClick?.(e);
      }}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, children, magnetic = true, href, ...rest }: Common & ComponentProps<typeof Link>) {
  const m = useMagnet<HTMLAnchorElement>();
  return (
    <Link href={href} {...rest} {...(magnetic ? m : {})} onClick={() => haptic(10)} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </Link>
  );
}
