// Studio screenshots (uses the seeded demo couple). usage: node scripts/studio-shots.mjs <outDir>
import { chromium } from "@playwright/test";
const out = process.argv[2] ?? "../../docs/screens/M6";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/login");
await p.getByLabel("Phone number").fill("+919800000000");
await p.getByRole("checkbox").check();
await p.getByRole("button", { name: "Send code" }).click();
await p.getByLabel("6-digit code").fill(await p.getByTestId("mock-code").textContent());
await p.getByRole("button", { name: "Verify" }).click();
await p.waitForURL("**/studio");
await p.screenshot({ path: `${out}/studio-home.jpg`, type: "jpeg", quality: 75 });
await p.goto("http://localhost:3000/studio/w-demo");
for (const tab of ["Guests", "Send", "Dashboard", "Shagun", "Plan"]) {
  await p.getByRole("tab", { name: tab }).click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/studio-${tab.toLowerCase()}.jpg`, type: "jpeg", quality: 75, fullPage: true });
}
await p.goto("http://localhost:3000/studio/new");
await p.getByLabel("Bride's name").fill("Ananya");
await p.getByLabel("Groom's name").fill("Rohan");
for (let i = 0; i < 5; i++) await p.getByRole("button", { name: "Next" }).click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/wizard-template.jpg`, type: "jpeg", quality: 75, fullPage: true });
await b.close();
