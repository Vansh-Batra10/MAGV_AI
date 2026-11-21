// Copies the self-hosted OFL fonts (latin + latin-ext + devanagari subsets) from @fontsource into public/fonts.
// Per-invite glyph subsets are produced at publish time by packages/renderer/scripts/subset_fonts.py.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const out = join(here, "..", "public", "fonts");
mkdirSync(out, { recursive: true });
const families = ["rozha-one", "martel", "yatra-one", "baloo-2", "bodoni-moda", "eb-garamond", "tiro-devanagari-hindi", "inter"];
let n = 0;
for (const f of families) {
  const dir = join(dirname(require.resolve(`@fontsource/${f}/package.json`)), "files");
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".woff2")) continue;
    if (!/-(latin|latin-ext|devanagari)-/.test(file)) continue;
    cpSync(join(dir, file), join(out, file));
    n++;
  }
}
console.log(`fonts: copied ${n} files to public/fonts`);
