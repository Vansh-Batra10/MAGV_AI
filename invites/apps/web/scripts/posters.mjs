// Regenerates the marketing hero posters (gate frames, no loader overlay). usage: node scripts/posters.mjs
import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const t of ["sheesh-mahal", "rang-kahani", "mohar"]) {
  const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(`http://localhost:3000/dev/playground?embed=1&template=${t}&tier=A&preset=${encodeURIComponent("demo: friend (playful Hinglish)")}`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.__inviteReady === true);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `public/marketing/${t}.jpg`, type: "jpeg", quality: 72 });
}
await b.close();
