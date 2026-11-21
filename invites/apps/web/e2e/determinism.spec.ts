import { expect, test } from "@playwright/test";

/** For each template, frames at storyboard keyframes must match after seeking elsewhere and back. */
for (const template of ["sheesh-mahal", "rang-kahani", "mohar"]) {
  test(`${template} renders deterministic frames`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`/dev/playground?embed=1&mode=autoplay&tier=A&template=${template}&preset=${encodeURIComponent("demo: friend (playful Hinglish)")}`);
    await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30_000 });
    const sb = await page.evaluate(() => window.__invite!.storyboard!);
    const grab = async (t: number) => { await page.evaluate((x) => window.__invite!.seek(x), t); await page.waitForTimeout(80); return page.screenshot(); };
    for (const k of sb.keyframes) await grab(k.t); // warm-up (fonts, lazy layers)
    for (const k of sb.keyframes) {
      const a = await grab(k.t);
      await grab((k.t + 9) % sb.duration);
      const b = await grab(k.t);
      const diff = await page.evaluate(async ([x, y]) => {
        const load = (s: string) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${s}`; });
        const [ia, ib] = await Promise.all([load(x!), load(y!)]);
        const c = document.createElement("canvas"); c.width = ia.width; c.height = ia.height; const g = c.getContext("2d")!;
        g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data; g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
        let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i]! - db[i]!) + Math.abs(da[i + 1]! - db[i + 1]!) + Math.abs(da[i + 2]! - db[i + 2]!) > 24) n++;
        return n / (da.length / 4);
      }, [a.toString("base64"), b.toString("base64")]);
      expect(diff, `${template} @ ${k.t}s`).toBeLessThan(0.0005);
    }
    await ctx.close();
  });
}
