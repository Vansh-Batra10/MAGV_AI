"use client";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Scroll reveal: fade + 24px rise + blur-to-sharp, staggered via `delay`. */
export function Reveal({ children, delay = 0, className, as: Tag = "div", style }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" | "span"; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.shown = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      style={{ ...style, transitionDelay: `${delay}ms` }}
      className={cn(
        "opacity-0 translate-y-6 blur-[6px] transition-[opacity,transform,filter] duration-700 ease-[var(--ease-expo)] data-[shown]:opacity-100 data-[shown]:translate-y-0 data-[shown]:blur-0 motion-reduce:translate-y-0 motion-reduce:blur-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
