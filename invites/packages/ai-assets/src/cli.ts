// pnpm assets:generate --template sheesh-mahal --pack jaipur-dusk [--slot door-left]
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSlot } from "./pipeline";

const a = Object.fromEntries(process.argv.slice(2).reduce<[string, string][]>((acc, v, i, arr) => (v.startsWith("--") ? [...acc, [v.slice(2), arr[i + 1] ?? ""]] : acc), []));
const template = a.template ?? "sheesh-mahal", pack = a.pack ?? "jaipur-dusk";
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "prompts", template, pack);
const slots = a.slot ? [a.slot] : readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => f.replace(/\.md$/, ""));
for (const slot of slots) {
  try {
    const r = await generateSlot({ template, pack, slot, consent: a.consent === "yes" });
    console.log(`${slot}: ${r.variants.length} variants, checks: ${r.checks.map((c) => `${c.name}=${c.ok}`).join(", ")} → pending review`);
  } catch (e) { console.log(`${slot}: skipped (${(e as Error).message})`); }
}
