import { join } from "node:path";
import { Store } from "@invites/db";

const g = globalThis as unknown as { __store?: Store };
/** Process-wide store. MOCK mode: JSON file under .data/ (DATA_FILE overrides). */
export function store(): Store {
  if (!g.__store) g.__store = new Store(process.env.DATA_FILE ?? join(process.cwd(), ".data", "db.json"));
  return g.__store;
}
