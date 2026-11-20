import type { APIRequestContext, Page } from "@playwright/test";

export async function setCookies(page: Page, site = "global") {
  await page.context().addCookies([
    { name: "hilo_consent", value: "essential", url: "http://localhost:3100" },
    { name: "hilo_site", value: site, url: "http://localhost:3100" },
  ]);
}

export async function draft(req: APIRequestContext, templateSlug: string, content?: unknown, giftLanguage = "en") {
  const r = await req.post("/api/gifts", { data: { templateSlug, content, giftLanguage, createdVia: "form" }, headers: { origin: "http://localhost:3100" } });
  return (await r.json()).id as string;
}
