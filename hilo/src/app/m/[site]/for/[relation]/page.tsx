import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata = { robots: { index: false } };
const RELATIONS = ["partner", "maa", "papa", "sibling", "best-friend", "group"];

export default async function ForRelation({ params }: { params: Promise<{ site: string; relation: string }> }) {
  const { h } = await resolveSite(params);
  const { relation } = await params;
  if (!RELATIONS.includes(relation)) notFound();
  const t = await getTranslations("comingSoon");
  const name = relation.replace("-", " ");
  return <ComingSoon title={name[0].toUpperCase() + name.slice(1)} body={t("relation", { name })} href={h("/gifts")} />;
}
