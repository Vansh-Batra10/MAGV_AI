import { z } from "zod";
import { body, err, json, limit, visitor } from "@/lib/server/http";
import { EVENT_NAMES, track } from "@/lib/server/events";
import { getSession } from "@/lib/server/auth";

const CLIENT_EVENTS = ["landing_view", "template_view", "question_step", "preview_shown", "keep_forever_clicked", "recipient_clicked_make_own", "contributor_clicked_make_own", "story_card_downloaded"] as const;
const B = z.object({ name: z.enum(CLIENT_EVENTS), giftId: z.string().max(40).optional(), props: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional() });

/** First-party analytics (no third parties). */
export async function POST(req: Request) {
  if (!(await limit("events", 300, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  if (!(EVENT_NAMES as readonly string[]).includes(b.data.name)) return err("bad_event");
  const v = await visitor();
  const s = await getSession();
  await track(b.data.name, { anonId: v.anonId, userId: s?.uid, giftId: b.data.giftId, props: { ...(b.data.props ?? {}), utm: v.utm?.utm_source ?? null } });
  return json({ ok: true });
}
