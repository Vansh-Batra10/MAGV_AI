import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Heart, MessageCircle, Mic, Eye, Video } from "lucide-react";
import { getProfile } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { isLive, type GiftRow } from "@/lib/server/gifts";
import { getTemplate } from "@/templates/registry";
import { AppChrome } from "@/components/layout/AppChrome";
import { DashActions, AccountActions } from "@/components/dashboard/DashActions";
import { formatMoney } from "@/config/pricing";
import { pick } from "@/templates/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My gifts", robots: { index: false } };

export default async function Dashboard() {
  const p = await getProfile();
  if (!p) redirect("/login?next=/dashboard");
  const t = await getTranslations("dashboard");
  const gifts = await q<GiftRow & { opens: number }>(`select g.*, (select count(*)::int from opens o where o.gift_id=g.id) as opens from gifts g where g.owner_id=$1 and g.status <> 'deleted' order by g.updated_at desc limit 100`, [p.id]);
  const replies = await q<{ id: string; gift_id: string; kind: string; text: string | null; voice_url: string | null; created_at: string; recipient_name: string | null }>(
    `select r.*, g.recipient_name from replies r join gifts g on g.id=r.gift_id where g.owner_id=$1 order by r.created_at desc limit 50`, [p.id]);
  const reactions = await q<{ id: string; storage_key: string; recipient_name: string | null }>(`select x.id, x.storage_key, g.recipient_name from reactions x join gifts g on g.id=x.gift_id where g.owner_id=$1 order by x.created_at desc limit 20`, [p.id]);
  const cur = p.currency === "INR" ? "INR" : "USD";
  return (
    <AppChrome right={<Link href="/dashboard/reminders" className="hover:text-hi">{t("reminders")}</Link>}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[48px] leading-none text-hi md:text-[64px]">{t("title")}</h1>
            <p className="mt-2 text-sm text-lo">{t("hello", { email: p.email })} · {t("wallet", { amount: formatMoney(p.wallet_balance_minor, cur) })} · {t("referral", { code: p.referral_code })}</p>
          </div>
          <Link href="/gifts" className="flex h-12 items-center rounded-full px-6 font-semibold text-white [background:var(--grad-kiss)]">{t("make")}</Link>
        </div>

        {gifts.length === 0 ? <p className="glass mt-8 p-8 text-center text-mid">{t("empty")}</p> : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2" data-testid="gift-list">
            {gifts.map((g) => {
              const tpl = getTemplate(g.template_slug);
              const live = isLive(g);
              const st = g.status === "draft" ? "draft" : live === "expired" ? "expired" : live === "removed" ? "removed" : g.status === "scheduled" ? "scheduled" : g.delivered_at ? "delivered" : "paid";
              return (
                <li key={g.id} className="glass flex gap-4 p-4">
                  <img src={tpl?.meta.demoPoster} alt="" className="h-24 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[24px] leading-tight text-hi">{g.recipient_name || "—"}</p>
                    <p className="text-sm text-mid">{tpl ? pick(tpl.meta.name, "en") : g.template_slug} · <span className="text-[var(--glow)]">{t(`status.${st}`)}</span></p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-lo"><Eye size={12} /> {g.first_opened_at ? t("opens", { n: g.opens }) : t("notOpened")}</p>
                    <DashActions giftId={g.id} slug={g.slug} template={g.template_slug} isDraft={g.status === "draft"} isGroup={g.mode === "group"} labels={{ open: t("open"), edit: t("edit"), manage: t("manage"), cont: t("continue"), del: t("delete"), confirm: t("confirmDelete") }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <h2 className="mt-14 font-display text-[34px] text-hi">{t("replies")}</h2>
        {replies.length === 0 ? <p className="mt-3 text-mid">{t("noReplies")}</p> : (
          <ul className="mt-4 flex flex-col gap-3">
            {replies.map((r) => (
              <li key={r.id} className="glass flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-400">{r.kind === "heart" ? <Heart size={18} fill="currentColor" /> : r.kind === "voice" ? <Mic size={18} /> : <MessageCircle size={18} />}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-hi">{r.recipient_name}</p>
                  {r.text && <p className="text-mid">{r.kind === "answer" ? (r.text === "forgiven" ? "Forgiven 🥹" : "Let's talk later") : r.text}</p>}
                  {r.voice_url && <audio src={r.voice_url} controls className="mt-1 h-9 w-full" />}
                </div>
              </li>
            ))}
          </ul>
        )}

        {reactions.length > 0 && (
          <>
            <h2 className="mt-14 flex items-center gap-2 font-display text-[34px] text-hi"><Video size={24} /> {t("reactions")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {reactions.map((r) => <video key={r.id} src={`/api/media/${r.storage_key}`} controls playsInline className="aspect-[9/16] w-full rounded-2xl bg-black object-cover" />)}
            </div>
          </>
        )}
        <AccountActions labels={{ signOut: t("signOut"), del: t("deleteAccount"), confirm: t("confirmAccount") }} />
      </div>
    </AppChrome>
  );
}
