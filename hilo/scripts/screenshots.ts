/** Captures every main route at 390×844 and 1440×900 for all editions into screenshots/<label>/. Needs `npm run dev`. */
import { chromium } from "playwright";
import fs from "node:fs";

const base = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] ?? "http://localhost:3000";
const label = process.argv.find((a) => a.startsWith("--label="))?.split("=")[1] ?? "latest";
const routes = ["/", "/gifts", "/gifts/christmas", "/gifts/birthday", "/t/laal-dhaaga", "/group", "/long-distance", "/pricing", "/reviews", "/about", "/contact", "/privacy"];
const prefixes = ["", "/in", "/in/en"];
const app = ["/create/midnight-birthday", "/login", "/studio/reel/laal-dhaaga?mode=preview", "/brand"];

(async () => {
  const dir = `screenshots/${label}`;
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([{ name: "hilo_consent", value: "essential", url: base }, { name: "hilo_site", value: "global", url: base }]);
    const page = await ctx.newPage();
    for (const r of [...prefixes.flatMap((p) => routes.map((x) => (p + (x === "/" ? "" : x)) || "/")), ...app]) {
      await page.goto(base + r, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(1500);
      const name = (r === "/" ? "home" : r.replace(/[/?=&]/g, "_").replace(/^_/, "")) + `-${w}`;
      await page.screenshot({ path: `${dir}/${name}.png` });
      console.log("✓", name);
    }
    await ctx.close();
  }
  await browser.close();
})();
