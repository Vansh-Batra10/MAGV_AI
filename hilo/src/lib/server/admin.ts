import "server-only";
import { notFound } from "next/navigation";
import { isAdmin } from "./auth";

/** Admin-only pages. In local development (NODE_ENV !== production) studio/brand tools are open for screenshots. */
export async function requireAdmin(opts: { devOpen?: boolean } = {}) {
  if (opts.devOpen && process.env.NODE_ENV !== "production") return;
  if (!(await isAdmin())) notFound();
}
