import { expect, test, type Page } from "@playwright/test";

const cases = [
  { template: "sheesh-mahal", invite: "demo", friend: "riyaFRND2", elder: "mehtaPAR1", office: "kapoorOF3" },
  { template: "rang-kahani", invite: "demo-rk", friend: "riyaFRND2rk", elder: "mehtaPAR1rk", office: "kapoorOF3rk" },
  { template: "mohar", invite: "demo-mh", friend: "riyaFRND2mh", elder: "mehtaPAR1mh", office: "kapoorOF3mh" },
];

async function openInvite(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("#inv-ssr-loader, .sm-loader, .rk-loader, .mh-loader").first()).toBeVisible();
  await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30_000 });
  await page.evaluate(() => window.__invite!.open(true));
}

for (const c of cases) {
  test.describe(c.template, () => {
    test("guest sees their name first, only their functions, and can RSVP", async ({ page }) => {
      await page.goto(`/${c.invite}/${c.office}`);
      // name painted by the SSR shell before any JS
      await expect(page.locator("#inv-ssr-loader, .sm-loader, .rk-loader, .mh-loader").first()).toContainText("Kapoor");
      await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30_000 });
      await page.evaluate(() => window.__invite!.open(true));
      const fns = page.locator("#inv-functions h3");
      await expect(fns).toHaveCount(2); // wedding + reception only
      await expect(page.locator("#inv-shagun")).toHaveCount(0);
      // RSVP
      await page.locator("#inv-rsvp").scrollIntoViewIfNeeded();
      const blocks = page.locator("#inv-rsvp .inv-rsvp-fn");
      await expect(blocks).toHaveCount(2);
      await blocks.nth(0).locator("[data-value=yes]").click();
      await blocks.nth(1).locator("[data-value=no]").click();
      await page.locator("#inv-rsvp [data-value=veg]").click();
      const resp = page.waitForResponse((r) => r.url().includes("/rsvp") && r.request().method() === "POST");
      await page.locator("#inv-rsvp button[type=submit]").click();
      expect((await resp).status()).toBe(200);
      await expect(page.locator("#inv-rsvp .inv-msg").first()).toBeVisible();
      // revisit: the reply is remembered
      await openInvite(page, `/${c.invite}/${c.office}`);
      await expect(page.locator("#inv-rsvp .inv-rsvp-fn").nth(0).locator("[data-value=yes]")).toHaveAttribute("aria-pressed", "true");
    });

    test("shagun opens a correct UPI intent for a guest who can see it", async ({ page }) => {
      await openInvite(page, `/${c.invite}/${c.friend}`);
      await page.locator("#inv-shagun").scrollIntoViewIfNeeded();
      await page.locator('#inv-shagun [data-block="b1"]').click();
      const link = page.locator(".inv-sheet [data-upi]").first();
      await expect(link).toBeVisible();
      const uri = await link.getAttribute("data-upi");
      expect(uri).toMatch(/^upi:\/\/pay\?pa=ananya\.rohan%40okdemo&pn=Ananya%20Mehta&am=2100\.00&cu=INR&tn=/);
      const pledge = page.waitForResponse((r) => r.url().includes("/pledge"));
      await page.locator(".inv-sheet button", { hasText: /bhej|sent|भेज/i }).first().click();
      expect((await pledge).status()).toBe(200);
    });

    test("interactive opening works by tap, and Lite mode has no canvas", async ({ page }) => {
      await page.goto(`/${c.invite}/${c.elder}`);
      await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30_000 });
      const btn = page.locator(".sm-open-btn, .rk-open-btn, .mh-open-btn").first();
      await btn.click();
      await expect(page.locator(".sm-dock, .rk-dock, .mh-dock").first()).toBeVisible({ timeout: 12_000 });
      await page.locator(".inv-footer button", { hasText: /Lite|हल्का/ }).click();
      await page.waitForFunction(() => window.__inviteReady === true && document.querySelector(".inv-lite") !== null);
      expect(await page.locator(".inv-root canvas.sm-mosaic-canvas, .inv-root canvas.sm-particles").count()).toBe(0);
    });
  });
}

test("public link asks for a name and shows only public functions", async ({ page }) => {
  await page.goto("/demo");
  await page.getByLabel("Aapka naam?").fill("Sunil");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/demo\/[0-9A-Za-z]{10}$/);
  await page.waitForFunction(() => window.__inviteReady === true, null, { timeout: 30_000 });
  await page.evaluate(() => window.__invite!.open(true));
  await expect(page.locator("#inv-functions h3")).toHaveCount(2);
});
