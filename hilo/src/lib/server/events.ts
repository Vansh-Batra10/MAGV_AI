import "server-only";
import { q } from "./db";
import { newId } from "@/lib/ids";

export const EVENT_NAMES = [
  "landing_view", "template_view", "question_step", "preview_shown", "checkout_started", "payment_success",
  "free_gift_sent", "gift_opened", "reply_sent", "reaction_sent", "keep_forever_clicked", "keep_forever_paid",
  "recipient_clicked_make_own", "contributor_submitted", "contributor_clicked_make_own", "partner_code_redeemed",
  "story_card_downloaded", "creator_started",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export async function track(name: EventName, data: { anonId?: string | null; userId?: string | null; giftId?: string | null; props?: Record<string, unknown> } = {}) {
  await q(`insert into events (id,name,anon_id,user_id,gift_id,props) values ($1,$2,$3,$4,$5,$6)`, [
    newId(), name, data.anonId ?? null, data.userId ?? null, data.giftId ?? null, data.props ?? {},
  ]);
}
