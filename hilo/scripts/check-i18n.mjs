// Fails the build if any message catalog is missing a key present in another.
import fs from "node:fs";
const files = ["en", "hi-Latn", "hi"];
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, p + k + ".") : [p + k]));
const sets = Object.fromEntries(files.map((f) => [f, new Set(flat(JSON.parse(fs.readFileSync(`messages/${f}.json`, "utf8"))))]));
const all = new Set(files.flatMap((f) => [...sets[f]]));
let bad = 0;
for (const f of files) {
  const missing = [...all].filter((k) => !sets[f].has(k));
  if (missing.length) {
    bad += missing.length;
    console.error(`✗ messages/${f}.json is missing ${missing.length} key(s):\n  ` + missing.slice(0, 40).join("\n  "));
  }
}
if (bad) process.exit(1);
console.log(`✓ i18n catalogs in sync (${all.size} keys × ${files.length} locales)`);
