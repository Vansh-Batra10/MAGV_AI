import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { contributionsFor, ensureContribToken, getEditableGift } from "@/lib/server/gifts";
import { one } from "@/lib/server/db";
import { visitor } from "@/lib/server/http";
import { AppChrome } from "@/components/layout/AppChrome";
import { Manage } from "@/components/group/Manage";
import { SITE_URL } from "@/config/brand";
import { firstName } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organiser dashboard", robots: { index: false } };

export default async function ManagePage({ params }: { params: Promise<{ giftId: string }> }) {
  const { giftId } = await params;
  const g = await getEditableGift(giftId);
  if (!g || g.mode !== "group") notFound();
  const token = await ensureContribToken(g.id, g.tier);
  const tk = await one<{ deadline_utc: string | null; max_contributions: number }>(`select deadline_utc, max_contributions from contrib_tokens where gift_id=$1`, [g.id]);
  const items = await contributionsFor(g.id, true);
  const t = await getTranslations("manage");
  const v = await visitor();
  const recipient = firstName(g.recipient_name) || "them";
  const reveal = g.deliver_at_utc ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: g.recipient_tz ?? "UTC" }).format(new Date(g.deliver_at_utc)) : null;
  return (
    <AppChrome glow="rose">
      <h1 className="mx-auto mb-8 max-w-5xl font-display text-[40px] leading-none text-hi md:text-[60px]">{t("title", { name: recipient })}</h1>
      <Manage giftId={g.id} recipient={recipient} contribUrl={`${SITE_URL}/c/${token}`} items={items.map((c) => ({ ...c, created_at: String(c.created_at) }))} max={tk?.max_contributions ?? 25} deadline={tk?.deadline_utc ? new Date(tk.deadline_utc).toISOString() : null} paid={!!g.paid_at} revealLabel={reveal} market={v.market} templateSlug={g.template_slug} />
    </AppChrome>
  );
}
