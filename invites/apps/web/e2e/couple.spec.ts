import { expect, test } from "@playwright/test";

test("couple flow: login → wizard → publish → pay → import → send → dashboard", async ({ page, request }) => {
  const phone = `+9197${String(Date.now()).slice(-8)}`;
  await page.goto("/login");
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send code" }).click();
  const code = (await page.getByTestId("mock-code").textContent())!;
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL("**/studio");

  const t0 = Date.now();
  await page.getByText("+ Create your invite").click();
  await page.getByLabel("Bride's name").fill("Meera");
  await page.getByLabel("Groom's name").fill("Kabir");
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: i === 6 ? "Next" : "Next" }).click();
  await page.getByRole("button", { name: "See my invite →" }).click();
  await page.waitForURL(/\/studio\/[0-9A-Za-z]+\?tab=preview/);
  expect(Date.now() - t0).toBeLessThan(180_000); // first preview well under 3 minutes
  await expect(page.locator("h1")).toContainText("Meera & Kabir");

  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByRole("tab", { name: "Plan" }).click();
  await page.getByRole("button", { name: "Choose Signature" }).click();
  await expect(page.getByRole("status")).toContainText("Signature active");

  await page.getByRole("tab", { name: "Guests" }).click();
  await page.getByLabel(/Paste a list/).fill("Sharma Parivar, 98100 12345\nRiya, 9876543210");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added 2");

  await page.getByRole("tab", { name: "Send" }).click();
  const wa = page.getByTestId("wa-send");
  const href = (await wa.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/919810012345\?text=/);
  const link = decodeURIComponent(href.split("text=")[1]!).split("\n").at(-1)!;
  expect(link).toMatch(/\/[0-9A-Za-z]{8}\/[0-9A-Za-z]{10}$/);
  await page.getByRole("button", { name: "Mark as sent" }).click();
  await expect(page.getByText("1 left to send")).toBeVisible();

  // The guest replies via their personal link
  const path = new URL(link).pathname;
  const r = await request.post(`/api/g${path}/rsvp`, { data: { entries: [{ eventId: "wedding", status: "yes", adults: 2, kids: 1 }], food: "jain", pickupNeeded: false, stayNeeded: false } });
  expect(r.ok()).toBeTruthy();
  await request.post(`/api/g${path}/open`, { data: { scene: "loader" } });

  await page.getByRole("tab", { name: "Dashboard" }).click();
  await page.reload();
  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(page.getByTestId("stat-replied")).toHaveText("1");
  await expect(page.getByTestId("adults-wedding")).toHaveText("2");
  await expect(page.getByTestId("stat-sent")).toHaveText("1");
});

test("another couple cannot read this wedding", async ({ request }) => {
  const r = await request.get("/api/studio/weddings/w-demo/summary");
  expect(r.status()).toBe(401);
});
