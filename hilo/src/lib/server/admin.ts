import "server-only";
import { notFound } from "next/navigation";
import { isAdmin } from "./auth";

/** Admin-only pages. Studio/brand/outbox are open in local dev, or when HILO_OPEN_TOOLS=1 (e2e/screenshots only — never in a real deployment). */
export async function requireAdmin(opts: { devOpen?: boolean } = {}) {
  if (opts.devOpen && (process.env.NODE_ENV !== "production" || process.env.HILO_OPEN_TOOLS === "1")) return;
  if (!(await isAdmin())) notFound();
}
