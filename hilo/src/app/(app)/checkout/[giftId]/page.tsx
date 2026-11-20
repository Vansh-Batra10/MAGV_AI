import { notFound } from "next/navigation";
import { getEditableGift, getGiftById, isLive } from "@/lib/server/gifts";
import { getProfile } from "@/lib/server/auth";
import { visitor } from "@/lib/server/http";
import { getTemplate } from "@/templates/registry";
import { displayName } from "@/templates/types";
import { durationsFor } from "@/config/pricing";
import { MOCK } from "@/lib/server/env";
import { Checkout } from "@/components/commerce/Checkout";
import { AppChrome } from "@/components/layout/AppChrome";
import { firstName } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ giftId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { giftId } = await params;
  const sp = await searchParams;
  const payer = sp.payer === "recipient" ? "recipient" : "sender";
  const purpose = sp.upgrade ? "upgrade" : "purchase";
  const gift = payer === "recipient" ? await getGiftById(giftId) : await getEditableGift(giftId);
  if (!gift) notFound();
  if (payer === "recipient" && (gift.duration !== "h24" || !["live", "expired"].includes(isLive(gift)))) notFound();
  if (purpose === "purchase" && gift.status !== "draft" && gift.slug && gift.tier !== "free") {
    // Already paid: go to success.
    const { redirect } = await import("next/navigation");
    redirect(`/success/${gift.id}`);
  }
  const tpl = getTemplate(gift.template_slug)!;
  const v = await visitor();
  const profile = await getProfile();
  const currency = sp.currency === "USD" || sp.currency === "INR" ? sp.currency : v.currency;
  return (
    <AppChrome glow={tpl.meta.glow}>
      <Checkout
        giftId={gift.id}
        tier={gift.tier}
        durations={durationsFor(gift.tier)}
        currency={currency}
        market={v.market}
        purpose={purpose}
        payer={payer}
        recipientName={firstName(gift.sender_name)}
        templateName={displayName(tpl.meta, gift.gift_language, v.market)}
        poster={tpl.meta.demoPoster}
        defaultEmail={profile?.email}
        walletMinor={profile?.wallet_balance_minor ?? 0}
        mock={MOCK.payments}
        slug={gift.slug}
        photosMax={tpl.meta.photosMax}
      />
    </AppChrome>
  );
}
