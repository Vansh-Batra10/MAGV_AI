// Keyframe screenshots for the Director's Checklists.
// usage: node scripts/screens.mjs --template sheesh-mahal --out ../../docs/screens/M2 [--tiers A,C] [--locales en,hi] [--packs a,b] [--base http://localhost:3000]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const base = args.base ?? "http://localhost:3000";
const template = args.template ?? "sheesh-mahal";
const out = args.out ?? "../../docs/screens/tmp";
const tiers = (args.tiers ?? "A,C").split(",");
const locales = (args.locales ?? "hinglish,hi").split(",");
const packs = (args.packs ?? "").split(",").filter(Boolean);
const presets = (args.presets ?? "demo: friend (playful Hinglish)").split("|");
const keyframes = (args.keyframes ?? "0.5,2,4,6,9").split(",").map(Number);
const chambers = args.chambers !== "0";
const video = args.video === "1";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

async function shot(page, name) {
  await page.screenshot({ path: join(out, `${name}.jpg`), type: "jpeg", quality: 78 });
  console.log("shot", name);
}

for (const pack of packs.length ? packs : [""]) for (const preset of presets) for (const tier of tiers) for (const locale of locales) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  const q = new URLSearchParams({ embed: "1", template, tier, locale, preset, ...(pack ? { pack } : {}) });
  await page.goto(`${base}/dev/playground?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30000 });
  const tag = `${template}${pack ? "-" + pack : ""}-${slug(preset)}-${tier}-${locale}`;
  await page.waitForTimeout(300);
  await shot(page, `${tag}-gate`);
  const t0 = Date.now();
  await page.evaluate(() => window.__invite.open());
  for (const k of keyframes) {
    const wait = k * 1000 - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await shot(page, `${tag}-t${k}`);
  }
  if (chambers) {
    const ids = await page.$$eval(".sm-chamber, .rk-spread, .mh-card-slot", (els) => els.map((e) => e.id).filter(Boolean));
    for (const id of ids) {
      await page.evaluate((id) => { const el = document.getElementById(id); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); }, id);
      await page.waitForTimeout(400);
      // scrub to the end of the pinned chapter
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.25));
      await page.waitForTimeout(900);
      await shot(page, `${tag}-${id}`);
    }
    for (const id of ["inv-shagun", "inv-rsvp"]) {
      const has = await page.$(`#${id}`);
      if (!has) continue;
      await page.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
      await page.waitForTimeout(500);
      await shot(page, `${tag}-${id}`);
    }
  }
  await ctx.close();
}

if (video) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const q = new URLSearchParams({ embed: "1", template, mode: "autoplay", tier: "A", locale: locales[0], preset: presets[0] });
  await page.goto(`${base}/dev/playground?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30000 });
  const sb = await page.evaluate(() => window.__invite.storyboard);
  for (const k of sb.keyframes) {
    await page.evaluate((t) => window.__invite.seek(t), k.t);
    await page.waitForTimeout(150);
    await shot(page, `${template}-video-${k.label}-${k.t}`);
  }
  await ctx.close();
}
await browser.close();
