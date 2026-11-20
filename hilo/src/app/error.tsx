"use client";
import { useEffect } from "react";
import { LogoMark } from "@/components/ui/Logo";

/** Route error boundary (cannot use server translations; short bilingual copy). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center [background:var(--grad-aurora)]">
      <LogoMark size={70} />
      <h1 className="font-display text-[42px] leading-tight text-hi">Something broke · Kuch toot gaya</h1>
      <p className="max-w-md text-mid">Not your fault. Try again — your drafts are safe.</p>
      <button type="button" onClick={reset} className="h-14 rounded-full px-8 font-semibold text-white [background:var(--grad-kiss)]">Try again</button>
    </main>
  );
}
