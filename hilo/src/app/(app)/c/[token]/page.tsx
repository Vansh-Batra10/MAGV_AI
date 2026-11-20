import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { one } from "@/lib/server/db";
import { getGiftById } from "@/lib/server/gifts";
import { AppChrome } from "@/components/layout/AppChrome";
import { Contribute } from "@/components/group/Contribute";
import { firstName } from "@/lib/paths";
import { now } from "@/lib/server/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add your message", robots: { index: false, follow: false } };

export default async function ContributorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tk = await one<{ gift_id: string; deadline_utc: string | null; max_contributions: number }>(`select gift_id, deadline_utc, max_contributions from contrib_tokens where token=$1`, [token]);
  if (!tk) notFound();
  const g = await getGiftById(tk.gift_id);
  if (!g || g.status === "deleted" || g.takedown_status !== "none") notFound();
  const n = (await one<{ n: number }>(`select count(*)::int as n from group_contributions where gift_id=$1`, [g.id]))?.n ?? 0;
  const t = await getTranslations("contribute");
  const closed = (tk.deadline_utc && new Date(tk.deadline_utc) < now()) || n >= tk.max_contributions || !!g.delivered_at;
  const deadlineLabel = tk.deadline_utc ? t("deadline", { when: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(tk.deadline_utc)) }) : null;
  return (
    <AppChrome glow="rose">
      {closed ? (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-display text-[44px] text-hi">{t("closed")}</h1>
          <p className="mt-3 text-mid">{t("closedSub")}</p>
        </div>
      ) : (
        <Contribute token={token} giftId={g.id} recipient={firstName(g.recipient_name) || "them"} organiser={firstName(g.sender_name) || "Someone"} count={n} deadlineLabel={deadlineLabel} />
      )}
    </AppChrome>
  );
}
