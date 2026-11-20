"use client";
export function trackClient(name: string, props?: Record<string, string | number | boolean | null>, giftId?: string) {
  try {
    const body = JSON.stringify({ name, props, giftId });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {}
}
