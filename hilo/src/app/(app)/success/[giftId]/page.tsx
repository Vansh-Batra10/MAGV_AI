import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";
import { ensureContribToken, getEditableGift, giftUrl } from "@/lib/server/gifts";
import { getProfile } from "@/lib/server/auth";
import { visitor } from "@/lib/server/http";
import { SITE_URL } from "@/config/brand";
import { formatMoney, upgradePrice, REFERRAL } from "@/config/pricing";
import { AppChrome } from "@/components/layout/AppChrome";
import { SuccessPanel } from "@/components/commerce/SuccessPanel";
import { getTemplate } from "@/templates/registry";
import { firstName } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gift is live", robots: { index: false } };

export default async function Success({ params }: { params: Promise<{ giftId: string }> }) {
  const { giftId } = await params;
  const g = await getEditableGift(giftId);
  if (!g) notFound();
  if (!g.slug) redirect(`/checkout/${g.id}`);
  const t = await getTranslations("success");
  const v = await visitor();
  const profile = await getProfile();
  const url = giftUrl(g.slug);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: "#2A1E1A", light: "#FFF8EF" } });
  const tpl = getTemplate(g.template_slug)!;
  const contribToken = g.mode === "group" ? await ensureContribToken(g.id, g.tier) : null;
  const fmt = (d: string) => new Intl.DateTimeFormat(v.market === "IN" ? "en-IN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  const scheduled = g.deliver_at_utc && !g.delivered_at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: g.recipient_tz ?? "UTC" }).format(new Date(g.deliver_at_utc)) : null;
  const title = g.tier === "free" ? t("titleFree") : scheduled ? t("titleScheduled") : t("title");
  return (
    <AppChrome glow={tpl.meta.glow}>
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="font-display text-[48px] leading-none text-hi md:text-[72px]">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-mid">{g.tier === "free" ? t("freeSub") : t("sub")}</p>
      </div>
      <SuccessPanel
        giftId={g.id}
        slug={g.slug}
        url={url}
        qr={qr}
        market={v.market}
        isFree={g.tier === "free"}
        is24h={g.duration === "h24"}
        expiresLabel={g.expires_at_utc ? t("expiresAt", { when: fmt(g.expires_at_utc) }) : null}
        upgradeLabel={g.duration === "h24" ? t("upgrade", { amount: formatMoney(upgradePrice(v.currency, g.tier), v.currency) }) : null}
        recipientName={firstName(g.recipient_name)}
        templateSlug={g.template_slug}
        scheduledLabel={scheduled}
        hasPassword={!!g.password_hash}
        contribUrl={contribToken ? `${SITE_URL}/c/${contribToken}` : null}
        isGroup={g.mode === "group"}
        signedIn={!!profile}
        giftLang={g.gift_language}
        referral={profile ? t("referral", { code: profile.referral_code, off: formatMoney(REFERRAL.refereeOffMinor[v.currency], v.currency), credit: formatMoney(REFERRAL.referrerCreditMinor[v.currency], v.currency) }) : null}
      />
    </AppChrome>
  );
}
