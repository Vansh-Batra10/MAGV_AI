import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { contributionsFor, getGiftBySlug, isLive, publicContent } from "@/lib/server/gifts";
import { passedGate } from "@/lib/server/giftAccess";
import { loadMessages } from "@/i18n/request";
import { GiftExperience } from "@/components/gift/GiftExperience";
import { GiftFooter } from "@/components/gift/GiftFooter";
import { ExpiredPage, NotYetPage, PasswordGate, RemovedPage } from "@/components/gift/StatePages";
import { firstName } from "@/lib/paths";
import { distanceUnitForCountry } from "@/config/markets";
import { BRAND } from "@/config/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGiftBySlug(slug);
  const name = firstName(g?.recipient_name) || "you";
  return {
    title: `A surprise for ${name} 💌`,
    description: `Someone made something for ${name}. Tap to open.`,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title: `A surprise for ${name} 💌`, description: `Made with ${BRAND.name}`, images: [`/api/og/${slug}`] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGiftBySlug(slug);
  if (!g) notFound();
  const lang = g.gift_language;
  const all = await loadMessages(lang);
  const messages = { gift: all.gift, media: all.media };
  const sender = firstName(g.sender_name);
  const state = isLive(g);

  let body: React.ReactNode;
  if (state === "draft") notFound();
  else if (state === "removed") body = <RemovedPage />;
  else if (state === "expired") body = <ExpiredPage slug={slug} senderFirstName={sender} />;
  else if (state === "locked") {
    const when = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: g.recipient_tz ?? "UTC" }).format(new Date(g.reveal_at_utc!));
    body = <NotYetPage when={when} />;
  } else if (!(await passedGate(g))) body = <PasswordGate slug={slug} senderFirstName={sender} />;
  else {
    const contributions = g.mode === "group" ? (await contributionsFor(g.id)).map((c) => ({ id: c.id, name: c.name, message: c.message, photoUrl: c.photo_url, voiceUrl: c.voice_url })) : undefined;
    const country = (await cookies()).get("hilo_country")?.value;
    body = (
      <>
        <GiftExperience
          slug={slug}
          giftId={g.id}
          template={g.template_slug}
          content={publicContent(g)}
          lang={lang}
          senderFirstName={sender}
          recipientName={g.recipient_name ?? ""}
          isFree={g.tier === "free"}
          is24h={g.duration === "h24"}
          expiresAt={g.expires_at_utc}
          contributions={contributions}
          units={distanceUnitForCountry(country)}
        />
        <GiftFooter slug={slug} />
      </>
    );
  }
  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      <div lang={lang === "hi" ? "hi" : lang === "hi-Latn" ? "hi-Latn" : "en"}>{body}</div>
    </NextIntlClientProvider>
  );
}
