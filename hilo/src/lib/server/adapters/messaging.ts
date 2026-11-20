import "server-only";
import { ENV, MOCK } from "../env";
import { q } from "../db";
import { newId } from "@/lib/ids";
import { log } from "../log";
import { ECONOMICS } from "@/config/pricing";

export type Channel = "whatsapp" | "email" | "sms";
export type MsgCategory = "utility" | "marketing" | "authentication";

export type OutboundMessage = {
  channel: Channel;
  to: string;
  template: string; // e.g. "gift_delivered"
  category: MsgCategory;
  subject?: string;
  text: string; // plain text body (also used for WhatsApp/SMS)
  html?: string;
  payload?: Record<string, unknown>;
};

function estCost(channel: Channel, category: MsgCategory): number {
  if (channel === "whatsapp") return category === "marketing" ? ECONOMICS.messagingCostMinor.whatsapp_marketing : ECONOMICS.messagingCostMinor.whatsapp_utility;
  if (channel === "sms") return ECONOMICS.messagingCostMinor.sms;
  return ECONOMICS.messagingCostMinor.email;
}

async function sendEmail(m: OutboundMessage) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: ENV.emailFrom, to: [m.to], subject: m.subject ?? "A note from us", text: m.text, html: m.html }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

async function sendWhatsApp(m: OutboundMessage) {
  // Business-initiated messages must use pre-approved templates. Template names map 1:1 to `m.template`.
  const res = await fetch(`https://graph.facebook.com/v21.0/${ENV.whatsappPhoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.whatsappToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: m.to.replace(/[^\d]/g, ""),
      type: "template",
      template: {
        name: m.template,
        language: { code: (m.payload?.lang as string) === "en" ? "en" : "hi" },
        components: [{ type: "body", parameters: ((m.payload?.params as string[]) ?? [m.text]).map((t) => ({ type: "text", text: t })) }],
      },
    }),
  });
  if (!res.ok) throw new Error(`whatsapp ${res.status}: ${await res.text()}`);
}

async function sendSms(m: OutboundMessage) {
  const body = new URLSearchParams({ To: m.to, From: ENV.twilioFrom, Body: m.text });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${ENV.twilioSid}:${ENV.twilioToken}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`sms ${res.status}: ${await res.text()}`);
}

/**
 * Every message is recorded in `outbox` (with category + estimated cost). If the channel is configured it is
 * sent for real; otherwise it stays visible at /admin/outbox (MOCK mode).
 */
export async function send(m: OutboundMessage): Promise<{ id: string; status: string }> {
  const id = newId();
  const mock = m.channel === "email" ? MOCK.email : m.channel === "whatsapp" ? MOCK.whatsapp : MOCK.sms;
  let status = mock ? "mocked" : "sent";
  let error: string | null = null;
  if (!mock) {
    try {
      if (m.channel === "email") await sendEmail(m);
      else if (m.channel === "whatsapp") await sendWhatsApp(m);
      else await sendSms(m);
    } catch (err) {
      status = "failed";
      error = String(err);
      log.error("messaging.failed", { channel: m.channel, template: m.template, error });
    }
  }
  await q(
    `insert into outbox (id, channel, "to", template, payload, status, category, est_cost_minor, error) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, m.channel, m.to, m.template, { subject: m.subject, text: m.text, ...m.payload }, status, m.category, mock ? 0 : estCost(m.channel, m.category), error],
  );
  return { id, status };
}

/** Pick the best channel for a contact in a market. Marketing goes to email unless WhatsApp opt-in. */
export function pickChannel(contact: { phone?: string | null; email?: string | null; whatsappOptIn?: boolean }, market: "IN" | "GLOBAL", category: MsgCategory): { channel: Channel; to: string } | null {
  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  if (category === "marketing") {
    if (email) return { channel: "email", to: email };
    if (phone && contact.whatsappOptIn && market === "IN") return { channel: "whatsapp", to: phone };
    return null;
  }
  if (phone) return { channel: market === "IN" ? "whatsapp" : "sms", to: phone };
  if (email) return { channel: "email", to: email };
  return null;
}
