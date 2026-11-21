import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@invites/config";
import { t } from "@invites/i18n";
import { store } from "@/lib/store";
import { guestView } from "@/lib/guest-view";
import { GuestInvite } from "@/components/GuestInvite";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ inviteCode: string; guestCode: string }> };

const SHELL: Record<string, { bg: string; ink: string; font: string }> = {
  "sheesh-mahal": { bg: "#141A45", ink: "#FBF5EA", font: "Martel, Georgia, serif" },
  "rang-kahani": { bg: "#FFF1D6", ink: "#231942", font: "'Baloo 2', system-ui, sans-serif" },
  mohar: { bg: "#4F1D3D", ink: "#F8F3E9", font: "'EB Garamond', Georgia, serif" },
};

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { inviteCode, guestCode } = await params;
  const b = store().guestBundle(inviteCode, guestCode);
  if (!b) return { title: brand.name };
  const { wedding: w, guest: g } = b;
  const names = `${w.content.bride.name} & ${w.content.groom.name}`;
  const title = g.locale === "en" ? `${g.salutation}, you're invited: ${names}` : `${g.salutation}, aapko nimantran hai: ${names}`;
  const og = `/api/og/${inviteCode}/${guestCode}?v=${encodeURIComponent(w.updatedAt)}`;
  return {
    title: { absolute: title }, description: t(g.locale, "youreInvited"), robots: { index: false, follow: false },
    openGraph: { title, description: names, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function GuestPage({ params }: P) {
  const { inviteCode, guestCode } = await params;
  const b = store().guestBundle(inviteCode, guestCode);
  if (!b) notFound();
  const data = guestView(b.wedding, b.guest);
  const shell = SHELL[data.templateId] ?? SHELL["sheesh-mahal"]!;
  const loaderText = t(data.guest.locale, "loaderFor", { salutation: data.guest.salutation });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return (
    <>
      <style>{`html,body{background:${shell.bg};margin:0}#inv-ssr-loader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:${shell.bg};color:${shell.ink};font:600 18px/1.4 ${shell.font};text-align:center;padding:24px;z-index:99}`}</style>
      <div id="inv-ssr-loader" role="status">{loaderText}</div>
      <GuestInvite data={data} inviteCode={inviteCode} guestCode={guestCode} shareUrl={`${base}/${inviteCode}/${guestCode}`} />
    </>
  );
}
