/**
 * Records every template in the Reel Studio at exactly 1080×1920 → marketing/reels/<slug>.webm
 * Usage: npm run dev (in another terminal), then `npm run reels` [-- --base=http://localhost:3000 --lang=hi-Latn --ms=30000]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES } from "../src/templates/registry";

const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const base = arg("base", "http://localhost:3000");
const lang = arg("lang", "en");
const ms = Number(arg("ms", "30000"));

(async () => {
  const out = path.resolve("marketing/reels");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const t of TEMPLATES) {
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: out, size: { width: 1080, height: 1920 } } });
    const page = await ctx.newPage();
    await page.goto(`${base}/studio/reel/${t.meta.slug}?lang=${lang}&autostart=1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(ms);
    const video = page.video();
    await ctx.close();
    if (video) fs.renameSync(await video.path(), path.join(out, `${t.meta.slug}${lang === "en" ? "" : "." + lang}.webm`));
    console.log("✓", t.meta.slug);
  }
  await browser.close();
})();
