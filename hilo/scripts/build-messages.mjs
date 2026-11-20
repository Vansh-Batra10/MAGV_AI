// Builds messages/{en,hi-Latn,hi}.json from messages/src/*.mjs, where every leaf is [en, hiLatn, hi].
// Edit the sources, then run `npm run i18n:build`. The JSON catalogs are what next-intl loads.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve("messages/src");
const tree = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  Object.assign(tree, mod.default);
}
const pick = (node, i, p = "") => {
  if (Array.isArray(node)) {
    if (node.length !== 3 || node.some((s) => typeof s !== "string")) throw new Error(`Bad leaf at ${p}`);
    return node[i];
  }
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, pick(v, i, p + "." + k)]));
};
["en", "hi-Latn", "hi"].forEach((loc, i) => fs.writeFileSync(`messages/${loc}.json`, JSON.stringify(pick(tree, i), null, 2) + "\n"));
console.log("✓ messages built");
