import { notFound, redirect } from "next/navigation";
import { getGiftBySlug } from "@/lib/server/gifts";
import { track } from "@/lib/server/events";

export const dynamic = "force-dynamic";

/** Recipient "Keep this forever" → recipient-paid upgrade checkout. */
export default async function Keep({ params }: { params: Promise<{ slug: string }> }) {
  const g = await getGiftBySlug((await params).slug);
  if (!g || g.duration !== "h24") notFound();
  await track("keep_forever_clicked", { giftId: g.id, props: { payer: "recipient" } });
  redirect(`/checkout/${g.id}?upgrade=1&payer=recipient`);
}
