import { isMockMode } from "@invites/config";

/**
 * Privacy-safe product analytics (couple funnel only). Never send guest PII: no names, phones, codes or IPs.
 * Allowed props are an explicit allow-list. Real mode posts to PostHog (POSTHOG_KEY).
 */
const ALLOWED = new Set(["template", "pack", "tier", "step", "locale", "tone", "scene", "count", "utm_source"]);
export async function track(event: string, distinctId: string, props: Record<string, string | number> = {}): Promise<void> {
  const safe = Object.fromEntries(Object.entries(props).filter(([k]) => ALLOWED.has(k)));
  if (isMockMode() || !process.env.POSTHOG_KEY) return;
  await fetch("https://eu.i.posthog.com/capture/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ api_key: process.env.POSTHOG_KEY, event, distinct_id: distinctId, properties: safe }) }).catch(() => {});
}
