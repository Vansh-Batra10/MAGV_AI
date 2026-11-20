import { getTranslations } from "next-intl/server";
import { resolveSite } from "@/lib/server/site";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { BRAND } from "@/config/brand";

export const metadata = { robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { h } = await resolveSite(params);
  const t = await getTranslations("comingSoon");
  void BRAND;
  return <ComingSoon title={"Partners"} body={t("partners", { email: BRAND.supportEmail })} href={h("/gifts")} />;
}
