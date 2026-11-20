import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setCookies } from "./helpers";

const ROUTES = ["/", "/in", "/gifts", "/t/laal-dhaaga", "/pricing", "/group", "/create/quick-surprise", "/login", "/privacy"];

test.beforeEach(async ({ page }) => setCookies(page));

for (const r of ROUTES) {
  test(`axe: ${r}`, async ({ page }) => {
    await page.goto(r);
    await page.waitForTimeout(1200);
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).disableRules(["color-contrast"]).analyze();
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (serious.length) console.log(r, serious.map((v) => `${v.id}: ${v.nodes.length} → ${v.nodes[0]?.target}`).join("\n"));
    expect(serious).toEqual([]);
  });
}
