import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function GlassCard({ className, strong, ...rest }: ComponentProps<"div"> & { strong?: boolean }) {
  return <div {...rest} className={cn(strong ? "glass-strong" : "glass", className)} />;
}
