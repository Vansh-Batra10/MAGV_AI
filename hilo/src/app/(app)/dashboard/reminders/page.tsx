import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { AppChrome } from "@/components/layout/AppChrome";
import { RemindersForm } from "@/components/dashboard/Reminders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Important dates", robots: { index: false } };

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const p = await getProfile();
  const sp = await searchParams;
  if (!p) redirect(`/login?next=${encodeURIComponent(`/dashboard/reminders${sp.name ? `?name=${encodeURIComponent(sp.name)}` : ""}`)}`);
  const t = await getTranslations("reminders");
  const rows = await q<{ id: string; person_name: string; relation: string | null; occasion: string; month: number; day: number; channel: string }>(`select id, person_name, relation, occasion, month, day, channel from reminders where user_id=$1 order by month, day`, [p.id]);
  return (
    <AppChrome glow="amber">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-[48px] leading-none text-hi">{t("title")}</h1>
        <p className="mt-2 text-mid">{t("sub")}</p>
        <RemindersForm initial={rows} defaultName={sp.name ?? ""} />
      </div>
    </AppChrome>
  );
}
