import { test, expect } from "@playwright/test";
import { draft, setCookies } from "./helpers";

test.beforeEach(async ({ page }) => setCookies(page));

test("free gift via question flow → recipient opens, replies, keeps forever", async ({ page }) => {
  await page.goto("/create/quick-surprise");
  const name = page.getByRole("textbox", { name: /name/i }).first();
  await expect(async () => {
    await name.fill("Meera");
    await expect(page.getByRole("button", { name: /^Next/ })).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // photo is optional
  const msg = page.getByRole("textbox", { name: /want to say/i });
  await expect(async () => {
    await msg.fill("Thinking of you today ☕");
    await expect(page.getByRole("button", { name: /^Next/ })).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.getByRole("button", { name: /^Next/ }).click();
  const sender = page.getByRole("textbox", { name: /your name/i });
  await expect(async () => {
    await sender.fill("Aarav");
    await expect(page.getByRole("button", { name: /Full preview/ }).last()).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.getByRole("button", { name: /Full preview/ }).last().click();
  await page.getByRole("button", { name: /Send free for 24 hours/ }).click();
  await page.waitForURL(/\/checkout\//);
  await page.getByLabel("Your email").fill("aarav@example.com");
  await page.getByRole("button", { name: "Send it free" }).click();
  await page.waitForURL(/\/success\//);
  const url = await page.getByTestId("gift-url").innerText();
  const slug = url.split("/g/")[1];
  expect(slug.length).toBeGreaterThanOrEqual(12);

  await page.goto(`/g/${slug}`);
  await page.getByText(/Tap to open/).click();
  await expect(page.getByText(/Thinking of you today/)).toBeVisible();
  await expect(page.getByText(/Tap to continue/)).toBeVisible({ timeout: 20_000 });
  await page.mouse.click(200, 300); // tap the scene to continue
  await page.getByRole("button", { name: "Tap the heart" }).click();
  await page.getByRole("button", { name: /Heart/ }).click();
  await expect(page.getByText(/Sent to Aarav/)).toBeVisible();

  // Recipient keeps it forever (recipient-paid upgrade).
  await page.goto(`/g/${slug}/keep`);
  await page.waitForURL(/upgrade=1&payer=recipient/);
  await page.getByLabel("Your email").fill("meera@example.com");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByTestId("mock-checkout").getByRole("button", { name: /Simulate success/ }).click();
  await page.waitForURL(new RegExp(`/g/${slug}`));
  const health = await page.request.get(`/api/health`);
  expect(health.ok()).toBeTruthy();
});

test("individual purchase + password gate + edit after purchase", async ({ page }) => {
  await page.goto("/");
  const id = await draft(page.request, "laal-dhaaga");
  await page.goto(`/checkout/${id}`);
  await page.getByRole("button", { name: /24 hours/ }).click();
  await page.getByRole("checkbox").first().check(); // password lock
  await page.getByPlaceholder("Choose a password").fill("chaand");
  await page.getByLabel("Your email").fill("buyer@example.com");
  await page.getByRole("checkbox").last().check();
  await expect(page.getByRole("button", { name: /Pay \$3\.99|Pay ₹99/ })).toBeVisible();
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByTestId("mock-checkout").getByRole("button", { name: /Simulate success/ }).click();
  await page.waitForURL(/\/success\//);
  const slug = (await page.getByTestId("gift-url").innerText()).split("/g/")[1];

  const recipient = await page.context().browser()!.newContext();
  const rp = await recipient.newPage();
  await rp.goto(`http://localhost:3100/g/${slug}`);
  await expect(rp.getByText("This gift is locked 🔒")).toBeVisible();
  await rp.getByLabel("Password").fill("wrong");
  await rp.getByRole("button", { name: "Open" }).click();
  await expect(rp.getByText(/Not quite/)).toBeVisible();
  await rp.getByLabel("Password").fill("chaand");
  await rp.getByRole("button", { name: "Open" }).click();
  await expect(rp.getByText(/Tap to open/)).toBeVisible();
  await recipient.close();

  // Edit after purchase keeps the same link.
  const r = await page.request.patch(`/api/gifts/${id}`, { data: { content: { recipientName: "Meera", senderName: "Aarav", yourCity: { name: "Toronto", tz: "America/Toronto", lat: 43.65, lon: -79.38, country: "CA" }, theirCity: { name: "Mumbai", tz: "Asia/Kolkata", lat: 19.08, lon: 72.88, country: "IN" }, photos: [], captions: [], threadLine: "Fixed typo", letter: "Hi", finale: "Same moon" } }, headers: { origin: "http://localhost:3100" } });
  expect(r.ok()).toBeTruthy();
});

test("group gift: contribute without login → organiser pays → scheduled reveal via cron (fake clock)", async ({ page, browser }) => {
  await page.goto("/");
  const id = await draft(page.request, "sab-ki-taraf-se");
  await page.goto(`/group/${id}/manage`);
  const contribUrl = await page.locator("span.font-mono").first().innerText({ timeout: 30_000 });
  const token = contribUrl.split("/c/")[1];

  const friend = await browser.newContext();
  const fp = await friend.newPage();
  await fp.goto(`http://localhost:3100/c/${token}`);
  await fp.getByLabel("Your name").fill("Kabir");
  await fp.getByLabel("Your message").fill("Happy birthday from Kabir!");
  await fp.getByRole("checkbox").last().check();
  await fp.getByRole("button", { name: "Add to the surprise" }).click();
  await expect(fp.getByText("You're in! 🎉")).toBeVisible();
  await friend.close();

  await page.reload();
  await expect(page.getByTestId("contrib-list")).toContainText("Kabir");

  // Schedule reveal 1 day ahead, pay, then run the delivery cron with a fake clock.
  const at = new Date(Date.now() + 86400000).toISOString();
  await page.request.post(`/api/gifts/${id}/settings`, { data: { deliverAtUtc: at, revealAtUtc: at, recipientTz: "Asia/Kolkata", recipientContact: { email: "riya@example.com" } }, headers: { origin: "http://localhost:3100" } });
  await page.goto(`/checkout/${id}`);
  await page.getByLabel("Your email").fill("tanvi@example.com");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByTestId("mock-checkout").getByRole("button", { name: /Simulate success/ }).click();
  await page.waitForURL(/\/success\//);
  const slug = (await page.getByTestId("gift-url").innerText()).split("/g/")[1];

  await page.goto(`/g/${slug}`);
  await expect(page.getByText("Not yet… ✨")).toBeVisible();

  const before = await (await page.request.get(`/api/cron/deliver`)).json();
  expect(before.delivered).toBe(0);
  const later = new Date(Date.now() + 2 * 86400000).toISOString();
  const after = await (await page.request.get(`/api/cron/deliver?now=${later}`)).json();
  expect(after.delivered).toBe(1);
  await page.goto("/admin/outbox");
  await expect(page.getByTestId("outbox")).toContainText("riya@example.com");
});

test("reply with voice-free path + reaction capture with fake camera", async ({ page }) => {
  await page.goto("/");
  const id = await draft(page.request, "quick-surprise", { recipientName: "Zoya", senderName: "Kabir", photo: "", message: "Hi" });
  await page.goto(`/checkout/${id}`);
  await page.getByLabel("Your email").fill("kabir@example.com");
  await page.getByRole("button", { name: "Send it free" }).click();
  await page.waitForURL(/\/success\//);
  const slug = (await page.getByTestId("gift-url").innerText()).split("/g/")[1];
  await page.goto(`/g/${slug}`);
  await page.getByText(/Tap to open/).click();
  await page.getByText("Hi").first().click({ timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.mouse.click(200, 400);
  await page.getByRole("button", { name: "Tap the heart" }).click();
  await page.getByRole("button", { name: /Write/ }).click();
  await page.getByPlaceholder("Say it…").fill("Love it!");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Sent to Kabir/)).toBeVisible();
  await page.getByRole("button", { name: /Record my reaction/ }).click();
  await expect(page.getByText(/Recording/)).toBeVisible();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: /Send to Kabir/ }).click();
  await expect(page.getByText(/Kabir is going to love this/)).toBeVisible();
});

test("editions: Global is English-only, India defaults to Hinglish", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Some things don't fit in a");
  const visible = await page.locator("body").innerText();
  expect(visible).not.toContain("₹");
  expect(visible).not.toContain("UPI");
  expect(visible).not.toMatch(/Kuch baatein|banao/);
  await page.goto("/in");
  await expect(page.locator("h1")).toContainText("Kuch baatein");
  await page.goto("/in/en");
  await expect(page.locator("h1")).toContainText("Some things don't fit in a");
  await page.goto("/?season=diwali");
  await expect(page.getByTestId("hero-eyebrow")).toContainText(/Diwali/);
});
